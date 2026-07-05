package handlers

import (
	"context"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestBuildAuthURL(t *testing.T) {
	cases := []struct {
		name     string
		repoURL  string
		username string
		password string
		want     string
	}{
		{
			name:     "https basic auth",
			repoURL:  "https://github.com/org/repo.git",
			username: "user",
			password: "pass",
			want:     "https://user:pass@github.com/org/repo.git",
		},
		{
			name:     "http basic auth",
			repoURL:  "http://git.example.com/org/repo.git",
			username: "user",
			password: "pass",
			want:     "http://user:pass@git.example.com/org/repo.git",
		},
		{
			name:     "github app token uses x-access-token username",
			repoURL:  "https://github.com/org/repo.git",
			username: gitHubAppTokenUsername,
			password: "ghs_installationtoken",
			want:     "https://x-access-token:ghs_installationtoken@github.com/org/repo.git",
		},
		{
			name:     "ssh url is left untouched",
			repoURL:  "ssh://git@github.com/org/repo.git",
			username: "user",
			password: "pass",
			want:     "ssh://git@github.com/org/repo.git",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := buildAuthURL(tc.repoURL, tc.username, tc.password); got != tc.want {
				t.Errorf("buildAuthURL() = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestResolveGitCredentials(t *testing.T) {
	t.Run("should return basic auth credentials from username/password keys", func(t *testing.T) {
		// Arrange
		data := map[string][]byte{
			"username": []byte("alice"),
			"password": []byte("s3cret"),
		}

		// Act
		username, password, err := resolveGitCredentials(context.Background(), data)

		// Assert
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if username != "alice" || password != "s3cret" {
			t.Errorf("expected alice/s3cret, got %s/%s", username, password)
		}
	})

	t.Run("should return empty credentials when the secret has neither auth method", func(t *testing.T) {
		// Act
		username, password, err := resolveGitCredentials(context.Background(), map[string][]byte{})

		// Assert
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if username != "" || password != "" {
			t.Errorf("expected empty credentials, got %s/%s", username, password)
		}
	})

	t.Run("should mint a GitHub App installation token as the password", func(t *testing.T) {
		// Arrange: a fake GitHub API returning an installation token
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !strings.HasSuffix(r.URL.Path, "/access_tokens") {
				t.Errorf("unexpected path: %s", r.URL.Path)
			}
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"token": "ghs_fromapp"})
		}))
		defer server.Close()

		_, pemBytes := generateTestRSAKey(t)
		data := map[string][]byte{
			secretKeyGitHubAppID:             []byte("123"),
			secretKeyGitHubAppInstallationID: []byte("789"),
			secretKeyGitHubAppPrivateKey:     pemBytes,
			secretKeyGitHubAppBaseURL:        []byte(server.URL),
		}

		// Act
		username, password, err := resolveGitCredentials(context.Background(), data)

		// Assert
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if username != gitHubAppTokenUsername {
			t.Errorf("expected username '%s', got '%s'", gitHubAppTokenUsername, username)
		}
		if password != "ghs_fromapp" {
			t.Errorf("expected minted token as password, got '%s'", password)
		}
	})

	t.Run("should prefer GitHub App auth over basic auth when both are present", func(t *testing.T) {
		// Arrange
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"token": "ghs_preferred"})
		}))
		defer server.Close()

		_, pemBytes := generateTestRSAKey(t)
		data := map[string][]byte{
			"username":                       []byte("alice"),
			"password":                       []byte("s3cret"),
			secretKeyGitHubAppID:             []byte("123"),
			secretKeyGitHubAppInstallationID: []byte("789"),
			secretKeyGitHubAppPrivateKey:     pemBytes,
			secretKeyGitHubAppBaseURL:        []byte(server.URL),
		}

		// Act
		username, password, err := resolveGitCredentials(context.Background(), data)

		// Assert
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if username != gitHubAppTokenUsername || password != "ghs_preferred" {
			t.Errorf("expected GitHub App auth to win, got %s/%s", username, password)
		}
	})

	t.Run("should return an error when the GitHub App private key is invalid", func(t *testing.T) {
		// Arrange: valid PEM structure is required; provide a non-key PEM block
		badPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: []byte("not-a-key")})
		data := map[string][]byte{
			secretKeyGitHubAppID:             []byte("123"),
			secretKeyGitHubAppInstallationID: []byte("789"),
			secretKeyGitHubAppPrivateKey:     badPEM,
		}

		// Act
		_, _, err := resolveGitCredentials(context.Background(), data)

		// Assert
		if err == nil {
			t.Error("expected an error for an invalid private key, got nil")
		}
	})
}
