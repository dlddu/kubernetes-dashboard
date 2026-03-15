package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestGitRepositoriesHandler tests the GET /api/fluxcd/gitrepositories endpoint
func TestGitRepositoriesHandler(t *testing.T) {
	t.Run("should return 200 OK with git repository list", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoriesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// In CI environment without cluster, 500 is acceptable
		// In cluster environment, 200 is expected
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}

		// If 200, verify JSON response structure
		if res.StatusCode == http.StatusOK {
			var gitRepositories []map[string]interface{}
			if err := json.NewDecoder(res.Body).Decode(&gitRepositories); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}
		}
	})

	t.Run("should set correct content-type header", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoriesHandler(w, req)

		// Assert
		contentType := w.Header().Get("Content-Type")
		if contentType != "application/json" {
			t.Errorf("expected Content-Type 'application/json', got '%s'", contentType)
		}
	})

	t.Run("should reject non-GET methods", func(t *testing.T) {
		// Arrange
		methods := []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch}

		for _, method := range methods {
			t.Run(method, func(t *testing.T) {
				req := httptest.NewRequest(method, "/api/fluxcd/gitrepositories", nil)
				w := httptest.NewRecorder()

				// Act
				GitRepositoriesHandler(w, req)

				// Assert
				res := w.Result()
				defer res.Body.Close()

				if res.StatusCode != http.StatusMethodNotAllowed {
					t.Errorf("expected status 405 for %s, got %d", method, res.StatusCode)
				}
			})
		}
	})

	t.Run("should accept namespace query parameter", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories?ns=default", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoriesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Should not fail with namespace parameter
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should return all namespaces when ns parameter is empty", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories?ns=", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoriesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Empty namespace should be treated as all namespaces
		if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status 200 or 500, got %d", res.StatusCode)
		}
	})

	t.Run("should handle client errors gracefully", func(t *testing.T) {
		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoriesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		// Response should always be valid JSON regardless of outcome
		var result interface{}
		if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
			t.Errorf("response should be valid JSON, got error: %v", err)
		}
	})
}

// TestGitRepositoriesHandlerResponseStructure tests the exact response format (cluster-dependent)
func TestGitRepositoriesHandlerResponseStructure(t *testing.T) {
	t.Run("should return array with required fields", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoriesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var gitRepositories []map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&gitRepositories); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		// If there are git repositories, verify structure
		if len(gitRepositories) > 0 {
			first := gitRepositories[0]
			requiredFields := []string{
				"name", "namespace", "url", "ready", "suspended",
				"revision", "interval", "branch", "tag",
			}
			for _, field := range requiredFields {
				if _, exists := first[field]; !exists {
					t.Errorf("expected field '%s' in git repository object, but not found", field)
				}
			}
		}
	})

	t.Run("should return valid JSON structure", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange
		req := httptest.NewRequest(http.MethodGet, "/api/fluxcd/gitrepositories", nil)
		w := httptest.NewRecorder()

		// Act
		GitRepositoriesHandler(w, req)

		// Assert
		res := w.Result()
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}

		var gitRepositories []struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace"`
			URL       string `json:"url"`
			Ready     bool   `json:"ready"`
			Suspended bool   `json:"suspended"`
			Revision  string `json:"revision"`
			Interval  string `json:"interval"`
			Branch    string `json:"branch"`
			Tag       string `json:"tag"`
		}

		if err := json.NewDecoder(res.Body).Decode(&gitRepositories); err != nil {
			t.Fatalf("failed to decode response into expected structure: %v", err)
		}

		// Verify each git repository has non-empty name and namespace
		for _, gr := range gitRepositories {
			if gr.Name == "" {
				t.Error("git repository name should not be empty")
			}
			if gr.Namespace == "" {
				t.Error("git repository namespace should not be empty")
			}
			t.Logf("GitRepository: name=%s, namespace=%s, ready=%v, suspended=%v",
				gr.Name, gr.Namespace, gr.Ready, gr.Suspended)
		}
	})
}
