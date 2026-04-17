package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// debugPodRequest is the JSON body accepted by PodDebugHandler.
type debugPodRequest struct {
	Image           string `json:"image"`
	TargetContainer string `json:"targetContainer,omitempty"`
	Name            string `json:"name,omitempty"`
}

// debugPodResponse is returned to the client when an ephemeral container has been created.
type debugPodResponse struct {
	Container string `json:"container"`
	Ready     bool   `json:"ready"`
}

// getDebugClientset returns the Kubernetes client used by PodDebugHandler.
// Tests may override this to inject a fake clientset.
var getDebugClientset func() (kubernetes.Interface, error) = func() (kubernetes.Interface, error) {
	return getKubernetesClient()
}

// debugReadyTimeout is the maximum duration PodDebugHandler waits for the
// ephemeral container to reach the Running state after creation.
var debugReadyTimeout = 20 * time.Second

// debugReadyPollInterval is the polling cadence used while waiting for the
// ephemeral container to become ready.
var debugReadyPollInterval = 200 * time.Millisecond

// nowFunc is overridable in tests to stabilize generated container names.
var nowFunc = time.Now

// PodDebugHandler handles POST /api/pods/debug/{namespace}/{name}.
// It injects an ephemeral debug container into the target pod and waits
// briefly for it to become ready before responding.
func PodDebugHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}
	r = withTimeout(r)

	namespace, name, err := parseResourcePath(r.URL.Path, podDebugPathPrefix, "")
	if err != nil {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("Invalid path format. Expected %s{namespace}/{name}", podDebugPathPrefix))
		return
	}

	var req debugPodRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, errMsgPodDebugInvalidReq)
		return
	}
	if req.Image == "" {
		writeError(w, http.StatusBadRequest, "Image is required")
		return
	}

	containerName := req.Name
	if containerName == "" {
		containerName = fmt.Sprintf("debugger-%d", nowFunc().Unix())
	}

	clientset, err := getDebugClientset()
	if err != nil {
		slog.Error("Failed to create Kubernetes client", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgClientCreate)
		return
	}

	if err := addEphemeralContainer(r.Context(), clientset, namespace, name, containerName, req); err != nil {
		var dErr *debugError
		if errors.As(err, &dErr) {
			writeError(w, dErr.status, dErr.message)
			return
		}
		slog.Error("Failed to add ephemeral container", "error", err, "namespace", namespace, "pod", name)
		writeResourceError(w, err, errMsgPodNotFound, errMsgPodDebugFailed)
		return
	}

	ready, err := waitForEphemeralContainerReady(r.Context(), clientset, namespace, name, containerName)
	if err != nil {
		var dErr *debugError
		if errors.As(err, &dErr) {
			writeError(w, dErr.status, dErr.message)
			return
		}
		slog.Error("Failed to wait for ephemeral container", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgPodDebugFailed)
		return
	}

	writeJSON(w, http.StatusOK, debugPodResponse{Container: containerName, Ready: ready})
}

// debugError is an internal error carrying an HTTP status code.
type debugError struct {
	status  int
	message string
}

func (e *debugError) Error() string { return e.message }

// addEphemeralContainer appends an EphemeralContainer to the pod spec and calls
// UpdateEphemeralContainers. On resourceVersion conflict it retries once.
func addEphemeralContainer(
	ctx context.Context,
	clientset kubernetes.Interface,
	namespace, podName, containerName string,
	req debugPodRequest,
) error {
	const maxAttempts = 2
	for attempt := 0; attempt < maxAttempts; attempt++ {
		pod, err := clientset.CoreV1().Pods(namespace).Get(ctx, podName, metav1.GetOptions{})
		if err != nil {
			return err
		}

		if nameCollides(pod, containerName) {
			return &debugError{status: http.StatusConflict, message: errMsgPodDebugNameTaken}
		}

		ec := corev1.EphemeralContainer{
			EphemeralContainerCommon: corev1.EphemeralContainerCommon{
				Name:                     containerName,
				Image:                    req.Image,
				Command:                  []string{"/bin/sh"},
				ImagePullPolicy:          corev1.PullIfNotPresent,
				Stdin:                    true,
				TTY:                      true,
				TerminationMessagePolicy: corev1.TerminationMessageReadFile,
			},
		}
		if req.TargetContainer != "" {
			ec.TargetContainerName = req.TargetContainer
		}

		pod.Spec.EphemeralContainers = append(pod.Spec.EphemeralContainers, ec)

		_, err = clientset.CoreV1().Pods(namespace).UpdateEphemeralContainers(ctx, podName, pod, metav1.UpdateOptions{})
		if err == nil {
			return nil
		}

		if k8serrors.IsForbidden(err) {
			return classifyForbidden(err)
		}
		if k8serrors.IsConflict(err) && attempt < maxAttempts-1 {
			continue
		}
		return err
	}
	return fmt.Errorf("exceeded retry attempts")
}

// nameCollides reports whether containerName is already used by any container in the pod spec.
func nameCollides(pod *corev1.Pod, containerName string) bool {
	for _, c := range pod.Spec.Containers {
		if c.Name == containerName {
			return true
		}
	}
	for _, c := range pod.Spec.InitContainers {
		if c.Name == containerName {
			return true
		}
	}
	for _, c := range pod.Spec.EphemeralContainers {
		if c.Name == containerName {
			return true
		}
	}
	return false
}

// waitForEphemeralContainerReady polls the pod status until the named ephemeral
// container reaches Running state, an unrecoverable Waiting reason appears, or the
// deadline is reached. It returns (true, nil) on Running. On image pull failures
// it returns a debugError with status 500. On timeout it returns a debugError
// with status 504 so the client can retry or surface a clear message.
func waitForEphemeralContainerReady(
	ctx context.Context,
	clientset kubernetes.Interface,
	namespace, podName, containerName string,
) (bool, error) {
	deadline := time.Now().Add(debugReadyTimeout)
	for {
		pod, err := clientset.CoreV1().Pods(namespace).Get(ctx, podName, metav1.GetOptions{})
		if err != nil {
			return false, err
		}

		for _, cs := range pod.Status.EphemeralContainerStatuses {
			if cs.Name != containerName {
				continue
			}
			if cs.State.Running != nil {
				return true, nil
			}
			if cs.State.Terminated != nil {
				return false, &debugError{
					status:  http.StatusInternalServerError,
					message: fmt.Sprintf("%s: %s", errMsgPodDebugFailed, cs.State.Terminated.Reason),
				}
			}
			if cs.State.Waiting != nil && isFatalWaitingReason(cs.State.Waiting.Reason) {
				msg := errMsgPodDebugImagePull
				if cs.State.Waiting.Message != "" {
					msg = fmt.Sprintf("%s: %s", msg, cs.State.Waiting.Message)
				}
				return false, &debugError{status: http.StatusInternalServerError, message: msg}
			}
			break
		}

		if time.Now().After(deadline) {
			return false, &debugError{status: http.StatusGatewayTimeout, message: errMsgPodDebugNotReady}
		}

		select {
		case <-ctx.Done():
			return false, ctx.Err()
		case <-time.After(debugReadyPollInterval):
		}
	}
}

// classifyForbidden distinguishes an RBAC denial from a cluster-side feature rejection.
// RBAC denials from the authorizer always contain the phrase "cannot ... pods/ephemeralcontainers"
// along with the service account identity; anything else is treated as "feature not supported".
func classifyForbidden(err error) *debugError {
	msg := err.Error()
	lower := strings.ToLower(msg)
	if strings.Contains(lower, "pods/ephemeralcontainers") && strings.Contains(lower, "cannot") {
		return &debugError{
			status:  http.StatusForbidden,
			message: fmt.Sprintf("%s: %s", errMsgPodDebugRBACDenied, msg),
		}
	}
	return &debugError{status: http.StatusBadRequest, message: errMsgPodDebugForbidden}
}

// isFatalWaitingReason returns true for waiting reasons that are not expected to recover
// without manual intervention, so we can fail fast instead of waiting for the timeout.
func isFatalWaitingReason(reason string) bool {
	switch reason {
	case "ImagePullBackOff", "ErrImagePull", "InvalidImageName", "CreateContainerError", "CreateContainerConfigError":
		return true
	default:
		return false
	}
}
