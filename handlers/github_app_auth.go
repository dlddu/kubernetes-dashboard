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
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// GitHub App authentication secret keys. These mirror the field names used by
// FluxCD's source-controller for GitHub App based Git authentication, so a
// Secret that already works with FluxCD works here unchanged.
const (
	secretKeyGitHubAppID             = "githubAppID"
	secretKeyGitHubAppInstallationID = "githubAppInstallationID"
	secretKeyGitHubAppPrivateKey     = "githubAppPrivateKey"
	secretKeyGitHubAppBaseURL        = "githubAppBaseURL"
)

// gitHubAppTokenUsername is the username git expects when authenticating with a
// GitHub App installation access token over HTTPS.
const gitHubAppTokenUsername = "x-access-token"

// defaultGitHubAPIBaseURL is the GitHub REST API base used when the Secret does
// not override it (e.g. GitHub Enterprise Server via githubAppBaseURL).
const defaultGitHubAPIBaseURL = "https://api.github.com"

// githubAppHTTPClient is used to exchange a JWT for an installation token.
var githubAppHTTPClient = &http.Client{Timeout: 15 * time.Second}

// githubAppCredentials holds the fields required to mint a GitHub App
// installation access token.
type githubAppCredentials struct {
	appID          string
	installationID string
	privateKeyPEM  []byte
	baseURL        string
}

// parseGitHubAppSecret extracts GitHub App credentials from a Secret's data.
// It returns nil when the required GitHub App fields are not all present, so
// callers can fall back to basic auth (username/password).
func parseGitHubAppSecret(data map[string][]byte) *githubAppCredentials {
	appID := strings.TrimSpace(string(data[secretKeyGitHubAppID]))
	installationID := strings.TrimSpace(string(data[secretKeyGitHubAppInstallationID]))
	privateKey := data[secretKeyGitHubAppPrivateKey]

	if appID == "" || installationID == "" || len(privateKey) == 0 {
		return nil
	}

	return &githubAppCredentials{
		appID:          appID,
		installationID: installationID,
		privateKeyPEM:  privateKey,
		baseURL:        strings.TrimSpace(string(data[secretKeyGitHubAppBaseURL])),
	}
}

// token mints a fresh installation access token for the GitHub App.
func (c *githubAppCredentials) token(ctx context.Context) (string, error) {
	return c.tokenWith(ctx, githubAppHTTPClient, time.Now())
}

// tokenWith is the injectable core of token, allowing tests to supply a stub
// HTTP client and a fixed clock.
func (c *githubAppCredentials) tokenWith(ctx context.Context, client *http.Client, now time.Time) (string, error) {
	jwt, err := generateGitHubAppJWT(c.appID, c.privateKeyPEM, now)
	if err != nil {
		return "", fmt.Errorf("failed to generate GitHub App JWT: %w", err)
	}

	baseURL := c.baseURL
	if baseURL == "" {
		baseURL = defaultGitHubAPIBaseURL
	}

	return fetchInstallationToken(ctx, client, baseURL, jwt, c.installationID)
}

// generateGitHubAppJWT builds and RS256-signs a JWT for authenticating as a
// GitHub App, per GitHub's requirements (iat backdated to tolerate clock drift,
// exp within 10 minutes, iss set to the App ID).
func generateGitHubAppJWT(appID string, privateKeyPEM []byte, now time.Time) (string, error) {
	key, err := parseRSAPrivateKey(privateKeyPEM)
	if err != nil {
		return "", err
	}

	header := map[string]string{"alg": "RS256", "typ": "JWT"}
	claims := map[string]any{
		"iat": now.Add(-60 * time.Second).Unix(),
		"exp": now.Add(8 * time.Minute).Unix(),
		"iss": appID,
	}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JWT header: %w", err)
	}
	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JWT claims: %w", err)
	}

	signingInput := base64.RawURLEncoding.EncodeToString(headerJSON) + "." +
		base64.RawURLEncoding.EncodeToString(claimsJSON)

	digest := sha256.Sum256([]byte(signingInput))
	signature, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest[:])
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT: %w", err)
	}

	return signingInput + "." + base64.RawURLEncoding.EncodeToString(signature), nil
}

// parseRSAPrivateKey decodes a PEM-encoded RSA private key, accepting both
// PKCS#1 ("RSA PRIVATE KEY") and PKCS#8 ("PRIVATE KEY") encodings. GitHub App
// keys are PKCS#1 by default, but users sometimes convert them to PKCS#8.
func parseRSAPrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block containing GitHub App private key")
	}

	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse GitHub App private key: %w", err)
	}

	rsaKey, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("GitHub App private key is not an RSA key")
	}
	return rsaKey, nil
}

// fetchInstallationToken exchanges a signed App JWT for an installation access
// token via the GitHub REST API.
func fetchInstallationToken(ctx context.Context, client *http.Client, baseURL, jwt, installationID string) (string, error) {
	url := fmt.Sprintf("%s/app/installations/%s/access_tokens",
		strings.TrimSuffix(baseURL, "/"), installationID)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to build installation token request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+jwt)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("installation token request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("failed to read installation token response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("GitHub App installation token request returned status %d", resp.StatusCode)
	}

	var tokenResp struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse installation token response: %w", err)
	}
	if tokenResp.Token == "" {
		return "", fmt.Errorf("installation token response did not contain a token")
	}

	return tokenResp.Token, nil
}
