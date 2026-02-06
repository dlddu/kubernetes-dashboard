package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestHealthEndpoint tests the /api/health endpoint
func TestHealthEndpoint(t *testing.T) {
	tests := []struct {
		name           string
		expectedStatus int
		expectedFields []string
	}{
		{
			name:           "should return 200 OK",
			expectedStatus: http.StatusOK,
			expectedFields: []string{"status"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
			w := httptest.NewRecorder()

			// Act
			HealthHandler(w, req)

			// Assert
			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

// TestHealthEndpointReturnsJSON tests that health endpoint returns valid JSON
func TestHealthEndpointReturnsJSON(t *testing.T) {
	// Arrange
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()

	// Act
	HealthHandler(w, req)

	// Assert
	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Errorf("expected valid JSON response, got error: %v", err)
	}
}

// TestHealthEndpointResponseStructure tests the structure of health response
func TestHealthEndpointResponseStructure(t *testing.T) {
	// Arrange
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()

	// Act
	HealthHandler(w, req)

	// Assert
	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	// Check required fields
	requiredFields := []string{"status"}
	for _, field := range requiredFields {
		if _, exists := response[field]; !exists {
			t.Errorf("expected field '%s' in response, but it was missing", field)
		}
	}

	// Check status value
	if status, ok := response["status"].(string); !ok {
		t.Error("expected 'status' to be a string")
	} else if status != "healthy" {
		t.Errorf("expected status 'healthy', got '%s'", status)
	}
}

// TestHealthEndpointMethodNotAllowed tests that non-GET methods are rejected
func TestHealthEndpointMethodNotAllowed(t *testing.T) {
	methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			// Arrange
			req := httptest.NewRequest(method, "/api/health", nil)
			w := httptest.NewRecorder()

			// Act
			HealthHandler(w, req)

			// Assert
			if w.Code != http.StatusMethodNotAllowed {
				t.Errorf("expected status %d for method %s, got %d", http.StatusMethodNotAllowed, method, w.Code)
			}
		})
	}
}
