package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/kubernetes"
)

// apiTimeout is the default timeout for Kubernetes API calls.
const apiTimeout = 30 * time.Second

// withTimeout returns a new request with a context deadline applied.
func withTimeout(r *http.Request) *http.Request {
	ctx, cancel := context.WithTimeout(r.Context(), apiTimeout)
	// cancel will be called when the request context is done
	go func() {
		<-ctx.Done()
		cancel()
	}()
	return r.WithContext(ctx)
}

// writeJSON writes a JSON response with the given status code and Content-Type header.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// writeError writes a JSON error response with the given status code and message.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// requireMethod checks if the request method matches the expected method.
// Returns true if the method is allowed. If not, writes a 405 response and returns false.
func requireMethod(w http.ResponseWriter, r *http.Request, method string) bool {
	if r.Method != method {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return false
	}
	return true
}

// parseResourcePath extracts namespace and name from a URL path with the given prefix.
// For example, parseResourcePath("/api/secrets/default/my-secret", "/api/secrets/") returns ("default", "my-secret", nil).
// An optional suffix (e.g., "/restart") can be stripped before parsing.
func parseResourcePath(urlPath, prefix, suffix string) (namespace, name string, err error) {
	path := strings.TrimPrefix(urlPath, prefix)
	if suffix != "" {
		path = strings.TrimSuffix(path, suffix)
	}

	parts := strings.SplitN(path, "/", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", fmt.Errorf("invalid path format, expected %s{namespace}/{name}", prefix)
	}

	return parts[0], parts[1], nil
}

// handleGet creates a GET handler that obtains the Kubernetes client, calls the
// provided fetch function, and writes the result as JSON. This eliminates repeated
// boilerplate across simple GET endpoints.
func handleGet(errMsg string, fetch func(r *http.Request) (interface{}, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !requireMethod(w, r, http.MethodGet) {
			return
		}

		r = withTimeout(r)

		result, err := fetch(r)
		if err != nil {
			writeError(w, http.StatusInternalServerError, errMsg)
			return
		}

		writeJSON(w, http.StatusOK, result)
	}
}

// resourceContext holds the parsed namespace, name, and Kubernetes client for a resource request.
type resourceContext struct {
	namespace string
	name      string
	clientset *kubernetes.Clientset
}

// withParsedResource extracts the common pattern of parsing a resource path and
// obtaining the Kubernetes client. It writes appropriate error responses on failure
// and returns nil if the request was already handled.
func withParsedResource(w http.ResponseWriter, r *http.Request, pathPrefix, pathSuffix string) *resourceContext {
	namespace, name, err := parseResourcePath(r.URL.Path, pathPrefix, pathSuffix)
	if err != nil {
		writeError(w, http.StatusBadRequest,
			fmt.Sprintf("Invalid path format. Expected %s{namespace}/{name}%s", pathPrefix, pathSuffix))
		return nil
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, errMsgClientCreate)
		return nil
	}

	return &resourceContext{namespace: namespace, name: name, clientset: clientset}
}

// writeResourceError writes an appropriate error response for Kubernetes API errors,
// handling NotFound as 404 and everything else as 500.
func writeResourceError(w http.ResponseWriter, err error, notFoundMsg, internalMsg string) {
	if errors.IsNotFound(err) {
		writeError(w, http.StatusNotFound, notFoundMsg)
		return
	}
	writeError(w, http.StatusInternalServerError, internalMsg)
}
