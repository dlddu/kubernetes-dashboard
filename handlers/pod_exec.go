package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/remotecommand"
)

// execMessage represents a JSON message exchanged over the WebSocket.
type execMessage struct {
	Type string `json:"type"`
	Data string `json:"data,omitempty"`
	Cols uint16 `json:"cols,omitempty"`
	Rows uint16 `json:"rows,omitempty"`
}

// terminalSession bridges a WebSocket connection to a Kubernetes exec stream.
// It implements io.Writer for stdout/stderr and remotecommand.TerminalSizeQueue for resize events.
type terminalSession struct {
	wsConn   *websocket.Conn
	sizeChan chan remotecommand.TerminalSize
	doneChan chan struct{}
	mu       sync.Mutex
}

// Write sends data from the exec stream (stdout/stderr) to the WebSocket as a JSON message.
func (t *terminalSession) Write(p []byte) (int, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	msg := execMessage{Type: "stdout", Data: string(p)}
	if err := t.wsConn.WriteJSON(msg); err != nil {
		return 0, err
	}
	return len(p), nil
}

// Next blocks until a terminal resize event is available or the session is done.
func (t *terminalSession) Next() *remotecommand.TerminalSize {
	select {
	case size := <-t.sizeChan:
		return &size
	case <-t.doneChan:
		return nil
	}
}

// writeError sends an error message over the WebSocket.
func (t *terminalSession) writeError(msg string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.wsConn.WriteJSON(execMessage{Type: "error", Data: msg}) //nolint:errcheck
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  8192,
	WriteBufferSize: 8192,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow same-origin and dev proxy connections
	},
}

// getExecClientset is a package-level variable for obtaining the Kubernetes client.
// Tests may override this to inject a fake clientset.
var getExecClientset func() (kubernetes.Interface, error) = func() (kubernetes.Interface, error) {
	return getKubernetesClient()
}

// getExecRESTConfig is a package-level variable for obtaining the REST config.
// Tests may override this to inject a fake config.
var getExecRESTConfig func() (*rest.Config, error) = getRESTConfig

// newSPDYExecutor is a package-level variable for creating an SPDY executor.
// Tests may override this to inject a mock executor.
var newSPDYExecutor = remotecommand.NewSPDYExecutor

// PodExecHandler handles the GET /api/pods/exec/{namespace}/{name}?container=... endpoint.
// It upgrades the connection to WebSocket and bridges it to a Kubernetes exec stream.
func PodExecHandler(w http.ResponseWriter, r *http.Request) {
	namespace, name, err := parseResourcePath(r.URL.Path, podExecPathPrefix, "")
	if err != nil {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("Invalid path format. Expected %s{namespace}/{name}", podExecPathPrefix))
		return
	}

	container := r.URL.Query().Get("container")
	if container == "" {
		writeError(w, http.StatusBadRequest, errMsgContainerRequired)
		return
	}

	clientset, err := getExecClientset()
	if err != nil {
		slog.Error("Failed to create Kubernetes client", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgClientCreate)
		return
	}

	// Validate that the pod exists and the container is present.
	pod, err := clientset.CoreV1().Pods(namespace).Get(r.Context(), name, metav1.GetOptions{})
	if err != nil {
		slog.Error("Failed to get pod", "error", err, "namespace", namespace, "name", name)
		writeError(w, http.StatusNotFound, errMsgPodNotFound)
		return
	}

	if !hasContainer(pod, container) {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("Container %q not found in pod %s/%s", container, namespace, name))
		return
	}

	config, err := getExecRESTConfig()
	if err != nil {
		slog.Error("Failed to get REST config", "error", err)
		writeError(w, http.StatusInternalServerError, errMsgClientCreate)
		return
	}

	// Upgrade to WebSocket.
	wsConn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("WebSocket upgrade failed", "error", err)
		// Upgrade already wrote the HTTP error response.
		return
	}
	defer wsConn.Close()

	session := &terminalSession{
		wsConn:   wsConn,
		sizeChan: make(chan remotecommand.TerminalSize, 1),
		doneChan: make(chan struct{}),
	}

	// Build the exec request URL.
	execURL := clientset.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(name).
		Namespace(namespace).
		SubResource("exec").
		VersionedParams(&corev1.PodExecOptions{
			Container: container,
			Command:   []string{"/bin/sh"},
			Stdin:     true,
			Stdout:    true,
			Stderr:    true,
			TTY:       true,
		}, scheme.ParameterCodec).
		URL()

	executor, err := newSPDYExecutor(config, "POST", execURL)
	if err != nil {
		slog.Error("Failed to create SPDY executor", "error", err)
		session.writeError(errMsgPodExecFailed)
		return
	}

	// Create a pipe for stdin: the WebSocket reader goroutine writes to it,
	// and the SPDY executor reads from it.
	stdinReader, stdinWriter := io.Pipe()
	defer stdinWriter.Close()

	// Start the WebSocket reader goroutine.
	go func() {
		defer close(session.doneChan)
		defer stdinWriter.Close()
		for {
			_, raw, err := wsConn.ReadMessage()
			if err != nil {
				return
			}
			var msg execMessage
			if err := json.Unmarshal(raw, &msg); err != nil {
				continue
			}
			switch msg.Type {
			case "stdin":
				if _, err := stdinWriter.Write([]byte(msg.Data)); err != nil {
					return
				}
			case "resize":
				select {
				case session.sizeChan <- remotecommand.TerminalSize{
					Width:  msg.Cols,
					Height: msg.Rows,
				}:
				default:
				}
			}
		}
	}()

	// Run the exec stream. This blocks until the remote process exits or the connection is closed.
	err = executor.StreamWithContext(r.Context(), remotecommand.StreamOptions{
		Stdin:             stdinReader,
		Stdout:            session,
		Stderr:            session,
		Tty:               true,
		TerminalSizeQueue: session,
	})

	if err != nil {
		slog.Error("Exec stream ended with error", "error", err,
			"namespace", namespace, "name", name, "container", container)
		session.writeError(err.Error())
	}
}

// hasContainer checks if the given container name exists in the pod spec.
func hasContainer(pod *corev1.Pod, containerName string) bool {
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
	return false
}
