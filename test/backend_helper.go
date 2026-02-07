package test

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"testing"
	"time"

	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

// BackendServer represents a test backend server instance
type BackendServer struct {
	Port       int
	Server     *http.Server
	Kubeconfig string
	t          *testing.T
}

// BackendConfig holds configuration for the test backend
type BackendConfig struct {
	Port       int    // Port to listen on (0 for random free port)
	Kubeconfig string // Path to kubeconfig file
}

// NewBackendServer creates a new backend server for testing
func NewBackendServer(t *testing.T, config BackendConfig) (*BackendServer, error) {
	t.Helper()

	// Use default kubeconfig if not specified
	if config.Kubeconfig == "" {
		config.Kubeconfig = getDefaultKubeconfig()
	}

	// Validate kubeconfig exists
	if _, err := os.Stat(config.Kubeconfig); err != nil {
		return nil, fmt.Errorf("kubeconfig not found at %s: %w", config.Kubeconfig, err)
	}

	// Validate kubeconfig can be loaded
	if err := validateKubeconfig(config.Kubeconfig); err != nil {
		return nil, fmt.Errorf("invalid kubeconfig: %w", err)
	}

	// Get a free port if not specified
	port := config.Port
	if port == 0 {
		freePort, err := getFreePort()
		if err != nil {
			return nil, fmt.Errorf("failed to get free port: %w", err)
		}
		port = freePort
	}

	bs := &BackendServer{
		Port:       port,
		Kubeconfig: config.Kubeconfig,
		t:          t,
	}

	return bs, nil
}

// Start starts the backend server in a goroutine
func (bs *BackendServer) Start() error {
	// Set KUBECONFIG environment variable
	originalKubeconfig := os.Getenv("KUBECONFIG")
	os.Setenv("KUBECONFIG", bs.Kubeconfig)

	// Create HTTP server
	mux := http.NewServeMux()

	// Health endpoint
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ok","message":"Backend is healthy"}`)
	})

	bs.Server = &http.Server{
		Addr:    fmt.Sprintf(":%d", bs.Port),
		Handler: mux,
	}

	// Start server in goroutine
	errChan := make(chan error, 1)
	go func() {
		bs.t.Logf("Starting backend server on port %d with kubeconfig: %s", bs.Port, bs.Kubeconfig)
		if err := bs.Server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errChan <- err
		}
	}()

	// Wait for server to start or fail
	select {
	case err := <-errChan:
		// Restore original KUBECONFIG
		if originalKubeconfig != "" {
			os.Setenv("KUBECONFIG", originalKubeconfig)
		} else {
			os.Unsetenv("KUBECONFIG")
		}
		return fmt.Errorf("failed to start server: %w", err)
	case <-time.After(2 * time.Second):
		// Server started successfully
		bs.t.Logf("Backend server started successfully on port %d", bs.Port)
	}

	// Wait for server to be ready
	if err := bs.WaitForReady(10 * time.Second); err != nil {
		bs.Stop()
		// Restore original KUBECONFIG
		if originalKubeconfig != "" {
			os.Setenv("KUBECONFIG", originalKubeconfig)
		} else {
			os.Unsetenv("KUBECONFIG")
		}
		return fmt.Errorf("server not ready: %w", err)
	}

	return nil
}

// Stop stops the backend server
func (bs *BackendServer) Stop() error {
	if bs.Server == nil {
		return nil
	}

	bs.t.Logf("Stopping backend server on port %d", bs.Port)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := bs.Server.Shutdown(ctx); err != nil {
		return fmt.Errorf("failed to shutdown server: %w", err)
	}

	bs.t.Logf("Backend server stopped")
	return nil
}

// WaitForReady waits for the server to be ready to accept requests
func (bs *BackendServer) WaitForReady(timeout time.Duration) error {
	client := &http.Client{
		Timeout: 1 * time.Second,
	}

	url := fmt.Sprintf("http://localhost:%d/api/health", bs.Port)
	deadline := time.Now().Add(timeout)

	for time.Now().Before(deadline) {
		resp, err := client.Get(url)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				bs.t.Logf("Backend server is ready")
				return nil
			}
		}

		time.Sleep(500 * time.Millisecond)
	}

	return fmt.Errorf("server not ready after %s", timeout)
}

// GetBaseURL returns the base URL of the server
func (bs *BackendServer) GetBaseURL() string {
	return fmt.Sprintf("http://localhost:%d", bs.Port)
}

// Helper functions

// getDefaultKubeconfig returns the default kubeconfig path
func getDefaultKubeconfig() string {
	// Check KUBECONFIG environment variable
	if kubeconfig := os.Getenv("KUBECONFIG"); kubeconfig != "" {
		return kubeconfig
	}

	// Use default location
	if home := homedir.HomeDir(); home != "" {
		return filepath.Join(home, ".kube", "config")
	}

	return ""
}

// validateKubeconfig validates that a kubeconfig file can be loaded
func validateKubeconfig(path string) error {
	config, err := clientcmd.LoadFromFile(path)
	if err != nil {
		return fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	if len(config.Clusters) == 0 {
		return fmt.Errorf("no clusters defined in kubeconfig")
	}

	if len(config.Contexts) == 0 {
		return fmt.Errorf("no contexts defined in kubeconfig")
	}

	return nil
}

// getFreePort gets a free port on the system
func getFreePort() (int, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer listener.Close()

	addr := listener.Addr().(*net.TCPAddr)
	return addr.Port, nil
}
