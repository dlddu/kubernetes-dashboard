package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	clienttesting "k8s.io/client-go/testing"
)

// newRunningPod returns a minimal Pod with a single Running container suitable for fake clientsets.
func newRunningPod(namespace, name string, containers ...string) *corev1.Pod {
	if len(containers) == 0 {
		containers = []string{"app"}
	}
	cs := make([]corev1.Container, 0, len(containers))
	for _, c := range containers {
		cs = append(cs, corev1.Container{Name: c})
	}
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace},
		Spec:       corev1.PodSpec{NodeName: "node-1", Containers: cs},
		Status:     corev1.PodStatus{Phase: corev1.PodRunning},
	}
}

// setEphemeralContainerRunning mutates the tracker so that the named ephemeral container
// reports a Running status. It must be called after UpdateEphemeralContainers has appended
// the spec entry.
func setEphemeralContainerRunning(t *testing.T, cs *fake.Clientset, namespace, name, containerName string) {
	t.Helper()
	obj, err := cs.Tracker().Get(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}, namespace, name)
	if err != nil {
		t.Fatalf("tracker get: %v", err)
	}
	pod, ok := obj.(*corev1.Pod)
	if !ok {
		t.Fatalf("tracker returned %T, want *corev1.Pod", obj)
	}
	pod.Status.EphemeralContainerStatuses = []corev1.ContainerStatus{
		{
			Name:  containerName,
			State: corev1.ContainerState{Running: &corev1.ContainerStateRunning{StartedAt: metav1.NewTime(time.Now())}},
		},
	}
	if err := cs.Tracker().Update(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}, pod, namespace); err != nil {
		t.Fatalf("tracker update: %v", err)
	}
}

// newDebugRequest builds a POST request with a JSON body for PodDebugHandler.
func newDebugRequest(t *testing.T, namespace, name string, body any) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			t.Fatalf("encode body: %v", err)
		}
	}
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/pods/debug/%s/%s", namespace, name), &buf)
	req.Header.Set("Content-Type", "application/json")
	return req
}

// withDebugClientset swaps the package-level debug clientset provider for the duration of the test.
func withDebugClientset(t *testing.T, cs kubernetes.Interface) {
	t.Helper()
	old := getDebugClientset
	getDebugClientset = func() (kubernetes.Interface, error) { return cs, nil }
	t.Cleanup(func() { getDebugClientset = old })
}

// withFastPolling shrinks the debug-ready polling timing so tests do not take ~20s.
func withFastPolling(t *testing.T, timeout, interval time.Duration) {
	t.Helper()
	oldTimeout, oldInterval := debugReadyTimeout, debugReadyPollInterval
	debugReadyTimeout = timeout
	debugReadyPollInterval = interval
	t.Cleanup(func() {
		debugReadyTimeout = oldTimeout
		debugReadyPollInterval = oldInterval
	})
}

func TestPodDebugHandler_RejectsNonPost(t *testing.T) {
	for _, method := range []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch} {
		t.Run(method, func(t *testing.T) {
			req := httptest.NewRequest(method, "/api/pods/debug/default/my-pod", nil)
			w := httptest.NewRecorder()
			PodDebugHandler(w, req)
			if w.Result().StatusCode != http.StatusMethodNotAllowed {
				t.Errorf("expected 405, got %d", w.Result().StatusCode)
			}
		})
	}
}

func TestPodDebugHandler_InvalidPath(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/pods/debug/justone", strings.NewReader(`{"image":"x"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	PodDebugHandler(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Result().StatusCode)
	}
}

func TestPodDebugHandler_RequiresImage(t *testing.T) {
	withDebugClientset(t, fake.NewSimpleClientset(newRunningPod("default", "my-pod")))
	req := newDebugRequest(t, "default", "my-pod", map[string]string{})
	w := httptest.NewRecorder()
	PodDebugHandler(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Result().StatusCode)
	}
}

func TestPodDebugHandler_InvalidJSON(t *testing.T) {
	withDebugClientset(t, fake.NewSimpleClientset(newRunningPod("default", "my-pod")))
	req := httptest.NewRequest(http.MethodPost, "/api/pods/debug/default/my-pod", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	PodDebugHandler(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Result().StatusCode)
	}
}

func TestPodDebugHandler_PodNotFound(t *testing.T) {
	withDebugClientset(t, fake.NewSimpleClientset())
	req := newDebugRequest(t, "default", "missing-pod", debugPodRequest{Image: "nicolaka/netshoot:latest"})
	w := httptest.NewRecorder()
	PodDebugHandler(w, req)
	if w.Result().StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Result().StatusCode)
	}
}

func TestPodDebugHandler_NameCollision(t *testing.T) {
	pod := newRunningPod("default", "my-pod", "app")
	withDebugClientset(t, fake.NewSimpleClientset(pod))
	req := newDebugRequest(t, "default", "my-pod", debugPodRequest{
		Image: "nicolaka/netshoot:latest",
		Name:  "app",
	})
	w := httptest.NewRecorder()
	PodDebugHandler(w, req)
	if w.Result().StatusCode != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Result().StatusCode)
	}
}

func TestPodDebugHandler_ForbiddenOnUpdate(t *testing.T) {
	pod := newRunningPod("default", "my-pod")
	cs := fake.NewSimpleClientset(pod)
	cs.PrependReactor("update", "pods", func(action clienttesting.Action) (bool, runtime.Object, error) {
		if action.GetSubresource() == "ephemeralcontainers" {
			return true, nil, k8serrors.NewForbidden(schema.GroupResource{Resource: "pods"}, "my-pod",
				fmt.Errorf("ephemeral containers disabled"))
		}
		return false, nil, nil
	})
	withDebugClientset(t, cs)

	req := newDebugRequest(t, "default", "my-pod", debugPodRequest{Image: "nicolaka/netshoot:latest"})
	w := httptest.NewRecorder()
	PodDebugHandler(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Result().StatusCode)
	}
	if !strings.Contains(w.Body.String(), "Ephemeral containers not enabled") {
		t.Errorf("expected forbidden message, got %q", w.Body.String())
	}
}

func TestPodDebugHandler_SuccessWithRunningContainer(t *testing.T) {
	pod := newRunningPod("default", "my-pod", "app")
	cs := fake.NewSimpleClientset(pod)
	// The fake clientset does not populate Status automatically, so we flip the status
	// after the handler's UpdateEphemeralContainers call runs.
	cs.PrependReactor("update", "pods", func(action clienttesting.Action) (bool, runtime.Object, error) {
		if action.GetSubresource() != "ephemeralcontainers" {
			return false, nil, nil
		}
		ua, ok := action.(clienttesting.UpdateAction)
		if !ok {
			return false, nil, nil
		}
		obj := ua.GetObject()
		accessor, err := meta.Accessor(obj)
		if err != nil {
			return false, nil, err
		}
		_ = accessor // name already in tracker
		// Let the default reactor persist the pod, then amend status in a goroutine
		// by returning false so subsequent Get reflects the update; then we mutate.
		return false, nil, nil
	})
	withDebugClientset(t, cs)
	withFastPolling(t, 500*time.Millisecond, 5*time.Millisecond)

	req := newDebugRequest(t, "default", "my-pod", debugPodRequest{
		Image:           "nicolaka/netshoot:latest",
		TargetContainer: "app",
		Name:            "debugger-1",
	})
	w := httptest.NewRecorder()

	// Flip status shortly after handler starts polling.
	go func() {
		time.Sleep(20 * time.Millisecond)
		setEphemeralContainerRunning(t, cs, "default", "my-pod", "debugger-1")
	}()

	PodDebugHandler(w, req)

	if w.Result().StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: body=%s", w.Result().StatusCode, w.Body.String())
	}
	var resp debugPodResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Container != "debugger-1" {
		t.Errorf("expected container debugger-1, got %s", resp.Container)
	}
	if !resp.Ready {
		t.Errorf("expected ready=true")
	}

	// Verify the ephemeral container was recorded on the pod spec.
	final, err := cs.CoreV1().Pods("default").Get(context.Background(), "my-pod", metav1.GetOptions{})
	if err != nil {
		t.Fatalf("get pod: %v", err)
	}
	if len(final.Spec.EphemeralContainers) != 1 {
		t.Fatalf("expected 1 ephemeral container, got %d", len(final.Spec.EphemeralContainers))
	}
	ec := final.Spec.EphemeralContainers[0]
	if ec.Name != "debugger-1" {
		t.Errorf("ephemeral container name = %s", ec.Name)
	}
	if ec.Image != "nicolaka/netshoot:latest" {
		t.Errorf("ephemeral container image = %s", ec.Image)
	}
	if ec.TargetContainerName != "app" {
		t.Errorf("target container = %s", ec.TargetContainerName)
	}
	if !ec.TTY || !ec.Stdin {
		t.Errorf("expected TTY+Stdin enabled, got tty=%v stdin=%v", ec.TTY, ec.Stdin)
	}
}

func TestPodDebugHandler_GeneratesNameWhenOmitted(t *testing.T) {
	pod := newRunningPod("default", "my-pod")
	cs := fake.NewSimpleClientset(pod)
	withDebugClientset(t, cs)
	withFastPolling(t, 200*time.Millisecond, 5*time.Millisecond)

	// Freeze time for deterministic generated name.
	old := nowFunc
	nowFunc = func() time.Time { return time.Unix(1700000000, 0) }
	t.Cleanup(func() { nowFunc = old })

	req := newDebugRequest(t, "default", "my-pod", debugPodRequest{Image: "busybox:1.36"})
	w := httptest.NewRecorder()

	go func() {
		time.Sleep(15 * time.Millisecond)
		setEphemeralContainerRunning(t, cs, "default", "my-pod", "debugger-1700000000")
	}()

	PodDebugHandler(w, req)

	if w.Result().StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Result().StatusCode, w.Body.String())
	}
	var resp debugPodResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Container != "debugger-1700000000" {
		t.Errorf("expected generated name debugger-1700000000, got %s", resp.Container)
	}
}

func TestPodDebugHandler_ImagePullFailure(t *testing.T) {
	pod := newRunningPod("default", "my-pod")
	cs := fake.NewSimpleClientset(pod)
	withDebugClientset(t, cs)
	withFastPolling(t, 500*time.Millisecond, 5*time.Millisecond)

	req := newDebugRequest(t, "default", "my-pod", debugPodRequest{
		Image: "does-not-exist:latest",
		Name:  "debugger-x",
	})
	w := httptest.NewRecorder()

	// Mark the ephemeral container as waiting with ImagePullBackOff.
	go func() {
		time.Sleep(20 * time.Millisecond)
		obj, err := cs.Tracker().Get(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}, "default", "my-pod")
		if err != nil {
			return
		}
		p := obj.(*corev1.Pod)
		p.Status.EphemeralContainerStatuses = []corev1.ContainerStatus{{
			Name: "debugger-x",
			State: corev1.ContainerState{Waiting: &corev1.ContainerStateWaiting{
				Reason:  "ImagePullBackOff",
				Message: "Back-off pulling image",
			}},
		}}
		_ = cs.Tracker().Update(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}, p, "default")
	}()

	PodDebugHandler(w, req)

	if w.Result().StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d: %s", w.Result().StatusCode, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "image pull") {
		t.Errorf("expected image pull error, got %q", w.Body.String())
	}
}

func TestPodDebugHandler_ReadinessTimeout(t *testing.T) {
	pod := newRunningPod("default", "my-pod")
	cs := fake.NewSimpleClientset(pod)
	withDebugClientset(t, cs)
	withFastPolling(t, 50*time.Millisecond, 5*time.Millisecond)

	req := newDebugRequest(t, "default", "my-pod", debugPodRequest{
		Image: "nicolaka/netshoot:latest",
		Name:  "debugger-y",
	})
	w := httptest.NewRecorder()
	PodDebugHandler(w, req)

	if w.Result().StatusCode != http.StatusGatewayTimeout {
		t.Fatalf("expected 504, got %d", w.Result().StatusCode)
	}
}

func TestHasContainer_MatchesEphemeral(t *testing.T) {
	pod := &corev1.Pod{
		Spec: corev1.PodSpec{
			EphemeralContainers: []corev1.EphemeralContainer{
				{EphemeralContainerCommon: corev1.EphemeralContainerCommon{Name: "debugger-1"}},
			},
		},
	}
	if !hasContainer(pod, "debugger-1") {
		t.Errorf("expected hasContainer to find ephemeral container")
	}
	if hasContainer(pod, "other") {
		t.Errorf("expected hasContainer to return false for unknown name")
	}
}
