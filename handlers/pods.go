package handlers

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// PodDetails represents detailed information about a pod
type PodDetails struct {
	Name           string   `json:"name"`
	Namespace      string   `json:"namespace"`
	Status         string   `json:"status"`
	Restarts       int32    `json:"restarts"`
	Node           string   `json:"node"`
	Age            string   `json:"age"`
	Containers     []string `json:"containers"`
	InitContainers []string `json:"initContainers"`
}

// podFilter is a predicate used to select which pods to include in results.
type podFilter func(corev1.Pod) bool

// UnhealthyPodsHandler handles the GET /api/pods/unhealthy endpoint
var UnhealthyPodsHandler = handleGet("Failed to fetch pods data", func(r *http.Request) (interface{}, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, err
	}
	namespace := r.URL.Query().Get("ns")
	return listPods(r.Context(), clientset, namespace, func(pod corev1.Pod) bool {
		return !isPodHealthy(pod)
	})
})

// getLogClientset is a package-level variable that returns a Kubernetes client.
// Tests may override this variable to inject a fake clientset.
var getLogClientset func() (kubernetes.Interface, error) = func() (kubernetes.Interface, error) {
	return getKubernetesClient()
}

// getPodLogStream is a package-level variable that retrieves a log stream for a pod.
// Tests may override this variable to inject a fake stream.
var getPodLogStream func(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts *corev1.PodLogOptions) (io.ReadCloser, error) = func(
	ctx context.Context,
	clientset kubernetes.Interface,
	namespace, name string,
	opts *corev1.PodLogOptions,
) (io.ReadCloser, error) {
	return clientset.CoreV1().Pods(namespace).GetLogs(name, opts).Stream(ctx)
}

// PodLogsHandler handles the GET /api/pods/logs/{namespace}/{name} endpoint.
func PodLogsHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	namespace, name, err := parseResourcePath(r.URL.Path, podLogsPathPrefix, "")
	if err != nil {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("Invalid path format. Expected %s{namespace}/{name}", podLogsPathPrefix))
		return
	}

	clientset, err := getLogClientset()
	if err != nil {
		writeError(w, http.StatusInternalServerError, errMsgClientCreate)
		return
	}

	container := r.URL.Query().Get("container")
	follow := r.URL.Query().Get("follow") == "true"

	tailLines := int64(500)
	if tl := r.URL.Query().Get("tailLines"); tl != "" {
		if parsed, parseErr := strconv.ParseInt(tl, 10, 64); parseErr == nil {
			tailLines = parsed
		}
	}

	opts := &corev1.PodLogOptions{
		Container: container,
		TailLines: &tailLines,
		Follow:    follow,
	}

	stream, err := getPodLogStream(r.Context(), clientset, namespace, name, opts)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			writeError(w, http.StatusNotFound, errMsgPodNotFound)
			return
		}
		if k8serrors.IsBadRequest(err) {
			errMsg := err.Error()
			// "waiting to start" means the container hasn't started yet (e.g., ImagePullBackOff).
			// Return empty logs with 200 instead of 400.
			if strings.Contains(errMsg, "waiting to start") {
				w.Header().Set("Content-Type", "text/plain")
				w.WriteHeader(http.StatusOK)
				return
			}
			writeError(w, http.StatusBadRequest, errMsg)
			return
		}
		writeError(w, http.StatusInternalServerError, errMsgPodLogsFetch)
		return
	}
	defer stream.Close()

	if follow {
		flusher, ok := w.(http.Flusher)
		if !ok {
			writeError(w, http.StatusInternalServerError, "streaming not supported")
			return
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.WriteHeader(http.StatusOK)

		scanner := bufio.NewScanner(stream)
		for {
			select {
			case <-r.Context().Done():
				return
			default:
			}

			if !scanner.Scan() {
				return
			}

			fmt.Fprintf(w, "data: %s\n\n", scanner.Text()) //nolint:errcheck
			flusher.Flush()
		}
	}

	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	io.Copy(w, stream) //nolint:errcheck
}

// AllPodsHandler handles the GET /api/pods/all endpoint
var AllPodsHandler = handleGet("Failed to fetch pods data", func(r *http.Request) (interface{}, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, err
	}
	namespace := r.URL.Query().Get("ns")
	return listPods(r.Context(), clientset, namespace, nil)
})

// listPods fetches pods from Kubernetes and converts them to PodDetails.
// If filter is non-nil, only pods matching the filter are included.
func listPods(ctx context.Context, clientset kubernetes.Interface, namespace string, filter podFilter) ([]PodDetails, error) {
	podList, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	pods := make([]PodDetails, 0, len(podList.Items))
	for _, pod := range podList.Items {
		if filter != nil && !filter(pod) {
			continue
		}

		nodeName := pod.Spec.NodeName
		if nodeName == "" {
			nodeName = podNodePending
		}

		containerNames := make([]string, 0, len(pod.Spec.Containers))
		for _, c := range pod.Spec.Containers {
			containerNames = append(containerNames, c.Name)
		}

		initContainerNames := make([]string, 0, len(pod.Spec.InitContainers))
		for _, c := range pod.Spec.InitContainers {
			initContainerNames = append(initContainerNames, c.Name)
		}

		pods = append(pods, PodDetails{
			Name:           pod.Name,
			Namespace:      pod.Namespace,
			Status:         getPodStatus(pod),
			Restarts:       getPodRestartCount(pod),
			Node:           nodeName,
			Age:            formatPodAge(pod.CreationTimestamp.Time),
			Containers:     containerNames,
			InitContainers: initContainerNames,
		})
	}

	return pods, nil
}

// getPodRestartCount calculates the total restart count for all containers in a pod
func getPodRestartCount(pod corev1.Pod) int32 {
	var totalRestarts int32
	for _, containerStatus := range pod.Status.ContainerStatuses {
		totalRestarts += containerStatus.RestartCount
	}
	return totalRestarts
}

// formatPodAge formats the pod age in a human-readable format (e.g., "2h30m", "3d", "45s")
func formatPodAge(creationTime time.Time) string {
	age := time.Since(creationTime)

	days := int(age.Hours() / 24)
	hours := int(age.Hours()) % 24
	minutes := int(age.Minutes()) % 60
	seconds := int(age.Seconds()) % 60

	return formatDuration(days, hours, minutes, seconds)
}

// formatDuration formats duration components into a human-readable string.
func formatDuration(days, hours, minutes, seconds int) string {
	if days > 0 {
		if hours > 0 {
			return fmt.Sprintf("%dd%dh", days, hours)
		}
		return fmt.Sprintf("%dd", days)
	}

	if hours > 0 {
		if minutes > 0 {
			return fmt.Sprintf("%dh%dm", hours, minutes)
		}
		return fmt.Sprintf("%dh", hours)
	}

	if minutes > 0 {
		return fmt.Sprintf("%dm", minutes)
	}

	if seconds > 0 {
		return fmt.Sprintf("%ds", seconds)
	}

	return "0s"
}
