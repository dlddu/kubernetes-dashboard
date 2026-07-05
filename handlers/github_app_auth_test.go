package handlers

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// generateTestRSAKey creates an RSA key and returns it alongside its PKCS#1 PEM encoding.
func generateTestRSAKey(t *testing.T) (*rsa.PrivateKey, []byte) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("failed to generate RSA key: %v", err)
	}
	pemBytes := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(key),
	})
	return key, pemBytes
}

func TestParseGitHubAppSecret(t *testing.T) {
	t.Run("should return credentials when all required fields are present", func(t *testing.T) {
		// Arrange
		data := map[string][]byte{
			secretKeyGitHubAppID:             []byte("123456"),
			secretKeyGitHubAppInstallationID: []byte("789"),
			secretKeyGitHubAppPrivateKey:     []byte("-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----"),
		}

		// Act
		creds := parseGitHubAppSecret(data)

		// Assert
		if creds == nil {
			t.Fatal("expected credentials, got nil")
		}
		if creds.appID != "123456" {
			t.Errorf("expected appID '123456', got '%s'", creds.appID)
		}
		if creds.installationID != "789" {
			t.Errorf("expected installationID '789', got '%s'", creds.installationID)
		}
		if len(creds.privateKeyPEM) == 0 {
			t.Error("expected non-empty private key")
		}
		if creds.baseURL != "" {
			t.Errorf("expected empty baseURL, got '%s'", creds.baseURL)
		}
	})

	t.Run("should capture optional base URL for GitHub Enterprise", func(t *testing.T) {
		// Arrange
		data := map[string][]byte{
			secretKeyGitHubAppID:             []byte("1"),
			secretKeyGitHubAppInstallationID: []byte("2"),
			secretKeyGitHubAppPrivateKey:     []byte("key"),
			secretKeyGitHubAppBaseURL:        []byte("https://github.example.com/api/v3"),
		}

		// Act
		creds := parseGitHubAppSecret(data)

		// Assert
		if creds == nil {
			t.Fatal("expected credentials, got nil")
		}
		if creds.baseURL != "https://github.example.com/api/v3" {
			t.Errorf("unexpected baseURL: '%s'", creds.baseURL)
		}
	})

	t.Run("should trim whitespace around scalar fields", func(t *testing.T) {
		// Arrange: kubectl create secret --from-literal often leaves trailing newlines
		data := map[string][]byte{
			secretKeyGitHubAppID:             []byte("  123456\n"),
			secretKeyGitHubAppInstallationID: []byte("789\n"),
			secretKeyGitHubAppPrivateKey:     []byte("key"),
			secretKeyGitHubAppBaseURL:        []byte(" https://example.com "),
		}

		// Act
		creds := parseGitHubAppSecret(data)

		// Assert
		if creds == nil {
			t.Fatal("expected credentials, got nil")
		}
		if creds.appID != "123456" {
			t.Errorf("expected trimmed appID '123456', got '%q'", creds.appID)
		}
		if creds.installationID != "789" {
			t.Errorf("expected trimmed installationID '789', got '%q'", creds.installationID)
		}
		if creds.baseURL != "https://example.com" {
			t.Errorf("expected trimmed baseURL, got '%q'", creds.baseURL)
		}
	})

	t.Run("should return nil when a required field is missing", func(t *testing.T) {
		cases := map[string]map[string][]byte{
			"missing appID": {
				secretKeyGitHubAppInstallationID: []byte("789"),
				secretKeyGitHubAppPrivateKey:     []byte("key"),
			},
			"missing installationID": {
				secretKeyGitHubAppID:         []byte("123"),
				secretKeyGitHubAppPrivateKey: []byte("key"),
			},
			"missing privateKey": {
				secretKeyGitHubAppID:             []byte("123"),
				secretKeyGitHubAppInstallationID: []byte("789"),
			},
			"empty appID value": {
				secretKeyGitHubAppID:             []byte("   "),
				secretKeyGitHubAppInstallationID: []byte("789"),
				secretKeyGitHubAppPrivateKey:     []byte("key"),
			},
			"basic auth only": {
				"username": []byte("user"),
				"password": []byte("pass"),
			},
			"empty data": {},
		}

		for name, data := range cases {
			t.Run(name, func(t *testing.T) {
				if creds := parseGitHubAppSecret(data); creds != nil {
					t.Errorf("expected nil credentials for %q, got %+v", name, creds)
				}
			})
		}
	})
}

func TestGenerateGitHubAppJWT(t *testing.T) {
	key, pemBytes := generateTestRSAKey(t)
	now := time.Unix(1_700_000_000, 0)

	t.Run("should produce a verifiable RS256 JWT with expected claims", func(t *testing.T) {
		// Act
		token, err := generateGitHubAppJWT("app-123", pemBytes, now)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		// Assert: structure
		parts := strings.Split(token, ".")
		if len(parts) != 3 {
			t.Fatalf("expected 3 JWT segments, got %d", len(parts))
		}

		// Assert: header
		headerJSON, err := base64.RawURLEncoding.DecodeString(parts[0])
		if err != nil {
			t.Fatalf("failed to decode header: %v", err)
		}
		var header map[string]string
		if err := json.Unmarshal(headerJSON, &header); err != nil {
			t.Fatalf("failed to parse header: %v", err)
		}
		if header["alg"] != "RS256" || header["typ"] != "JWT" {
			t.Errorf("unexpected header: %+v", header)
		}

		// Assert: claims
		claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			t.Fatalf("failed to decode claims: %v", err)
		}
		var claims struct {
			Iat int64  `json:"iat"`
			Exp int64  `json:"exp"`
			Iss string `json:"iss"`
		}
		if err := json.Unmarshal(claimsJSON, &claims); err != nil {
			t.Fatalf("failed to parse claims: %v", err)
		}
		if claims.Iss != "app-123" {
			t.Errorf("expected iss 'app-123', got '%s'", claims.Iss)
		}
		if claims.Iat != now.Add(-60*time.Second).Unix() {
			t.Errorf("iat not backdated as expected: %d", claims.Iat)
		}
		if claims.Exp <= now.Unix() {
			t.Errorf("exp %d should be in the future relative to %d", claims.Exp, now.Unix())
		}
		// GitHub rejects tokens whose lifetime exceeds 10 minutes.
		if claims.Exp-claims.Iat > int64((10 * time.Minute).Seconds()) {
			t.Errorf("token lifetime %ds exceeds GitHub's 10 minute maximum", claims.Exp-claims.Iat)
		}

		// Assert: signature is valid for the signing input
		signingInput := parts[0] + "." + parts[1]
		digest := sha256.Sum256([]byte(signingInput))
		sig, err := base64.RawURLEncoding.DecodeString(parts[2])
		if err != nil {
			t.Fatalf("failed to decode signature: %v", err)
		}
		if err := rsa.VerifyPKCS1v15(&key.PublicKey, crypto.SHA256, digest[:], sig); err != nil {
			t.Errorf("signature verification failed: %v", err)
		}
	})

	t.Run("should accept a PKCS#8 encoded private key", func(t *testing.T) {
		// Arrange
		pkcs8, err := x509.MarshalPKCS8PrivateKey(key)
		if err != nil {
			t.Fatalf("failed to marshal PKCS#8: %v", err)
		}
		pkcs8PEM := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: pkcs8})

		// Act
		token, err := generateGitHubAppJWT("app-123", pkcs8PEM, now)

		// Assert
		if err != nil {
			t.Fatalf("expected PKCS#8 key to be accepted, got error: %v", err)
		}
		if token == "" {
			t.Error("expected a non-empty token")
		}
	})

	t.Run("should error on an invalid PEM private key", func(t *testing.T) {
		// Act
		_, err := generateGitHubAppJWT("app-123", []byte("not a pem"), now)

		// Assert
		if err == nil {
			t.Error("expected an error for invalid PEM, got nil")
		}
	})
}

func TestFetchInstallationToken(t *testing.T) {
	t.Run("should return the token from a 201 response", func(t *testing.T) {
		// Arrange
		var gotMethod, gotPath, gotAuth, gotAccept string
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotMethod = r.Method
			gotPath = r.URL.Path
			gotAuth = r.Header.Get("Authorization")
			gotAccept = r.Header.Get("Accept")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"token": "ghs_installationtoken", "expires_at": "2026-01-01T00:00:00Z"})
		}))
		defer server.Close()

		// Act
		token, err := fetchInstallationToken(context.Background(), server.Client(), server.URL, "signed.jwt.value", "789")

		// Assert
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if token != "ghs_installationtoken" {
			t.Errorf("expected token 'ghs_installationtoken', got '%s'", token)
		}
		if gotMethod != http.MethodPost {
			t.Errorf("expected POST, got %s", gotMethod)
		}
		if gotPath != "/app/installations/789/access_tokens" {
			t.Errorf("unexpected request path: %s", gotPath)
		}
		if gotAuth != "Bearer signed.jwt.value" {
			t.Errorf("unexpected Authorization header: %s", gotAuth)
		}
		if gotAccept != "application/vnd.github+json" {
			t.Errorf("unexpected Accept header: %s", gotAccept)
		}
	})

	t.Run("should trim a trailing slash on the base URL", func(t *testing.T) {
		// Arrange
		var gotPath string
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			gotPath = r.URL.Path
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"token": "t"})
		}))
		defer server.Close()

		// Act
		_, err := fetchInstallationToken(context.Background(), server.Client(), server.URL+"/", "jwt", "1")

		// Assert
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if strings.Contains(gotPath, "//") {
			t.Errorf("expected no double slash in path, got %s", gotPath)
		}
	})

	t.Run("should error on a non-201 status", func(t *testing.T) {
		// Arrange
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"message":"Bad credentials"}`))
		}))
		defer server.Close()

		// Act
		_, err := fetchInstallationToken(context.Background(), server.Client(), server.URL, "jwt", "1")

		// Assert
		if err == nil {
			t.Error("expected an error for 401 response, got nil")
		}
	})

	t.Run("should error when the response omits a token", func(t *testing.T) {
		// Arrange
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{"expires_at":"2026-01-01T00:00:00Z"}`))
		}))
		defer server.Close()

		// Act
		_, err := fetchInstallationToken(context.Background(), server.Client(), server.URL, "jwt", "1")

		// Assert
		if err == nil {
			t.Error("expected an error when token is missing, got nil")
		}
	})
}

func TestGitHubAppCredentialsTokenWith(t *testing.T) {
	_, pemBytes := generateTestRSAKey(t)

	t.Run("should mint an installation token end-to-end", func(t *testing.T) {
		// Arrange: server asserts a bearer JWT is presented, then returns a token
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if !strings.HasPrefix(auth, "Bearer ") || strings.Count(auth, ".") != 2 {
				t.Errorf("expected a bearer JWT, got %q", auth)
			}
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"token": "ghs_end2end"})
		}))
		defer server.Close()

		creds := &githubAppCredentials{
			appID:          "app-1",
			installationID: "42",
			privateKeyPEM:  pemBytes,
			baseURL:        server.URL,
		}

		// Act
		token, err := creds.tokenWith(context.Background(), server.Client(), time.Unix(1_700_000_000, 0))

		// Assert
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if token != "ghs_end2end" {
			t.Errorf("expected token 'ghs_end2end', got '%s'", token)
		}
	})

	t.Run("should propagate signing errors before making a request", func(t *testing.T) {
		// Arrange
		creds := &githubAppCredentials{
			appID:          "app-1",
			installationID: "42",
			privateKeyPEM:  []byte("bogus"),
		}

		// Act
		_, err := creds.tokenWith(context.Background(), http.DefaultClient, time.Unix(1_700_000_000, 0))

		// Assert
		if err == nil {
			t.Error("expected an error for an invalid private key, got nil")
		}
	})
}
