package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
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
