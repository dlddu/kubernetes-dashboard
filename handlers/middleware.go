package handlers

import (
	"encoding/json"
	"net/http"
)

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
