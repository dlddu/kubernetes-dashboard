package test

import (
	"net/http"
	"os"
	"testing"
	"time"
)

func TestBackendServer_StartStop(t *testing.T) {
	// Skip if no kubeconfig available
	kubeconfig := getDefaultKubeconfig()
	if _, err := os.Stat(kubeconfig); err != nil {
		t.Skip("Skipping test: kubeconfig not found")
	}

	// Arrange
	config := BackendConfig{
		Port:       0, // Use random free port
		Kubeconfig: kubeconfig,
	}

	server, err := NewBackendServer(t, config)
	if err != nil {
		t.Fatalf("Failed to create backend server: %v", err)
	}

	// Act: Start server
	if err := server.Start(); err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	defer server.Stop()

	// Assert: Server should be running
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(server.GetBaseURL() + "/api/health")
	if err != nil {
		t.Fatalf("Failed to connect to server: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	// Act: Stop server
	if err := server.Stop(); err != nil {
		t.Errorf("Failed to stop server: %v", err)
	}

	// Assert: Server should be stopped (connection should fail)
	time.Sleep(500 * time.Millisecond)
	_, err = client.Get(server.GetBaseURL() + "/api/health")
	if err == nil {
		t.Error("Expected connection to fail after stopping server")
	}
}

func TestBackendServer_HealthEndpoint(t *testing.T) {
	// Skip if no kubeconfig available
	kubeconfig := getDefaultKubeconfig()
	if _, err := os.Stat(kubeconfig); err != nil {
		t.Skip("Skipping test: kubeconfig not found")
	}

	// Arrange
	server, err := NewBackendServer(t, BackendConfig{
		Kubeconfig: kubeconfig,
	})
	if err != nil {
		t.Fatalf("Failed to create backend server: %v", err)
	}

	if err := server.Start(); err != nil {
		t.Fatalf("Failed to start server: %v", err)
	}
	defer server.Stop()

	// Act
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(server.GetBaseURL() + "/api/health")
	if err != nil {
		t.Fatalf("Failed to call health endpoint: %v", err)
	}
	defer resp.Body.Close()

	// Assert
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("Expected Content-Type application/json, got %s", contentType)
	}
}

func TestBackendServer_InvalidKubeconfig(t *testing.T) {
	// Arrange: Use non-existent kubeconfig
	config := BackendConfig{
		Kubeconfig: "/non/existent/kubeconfig",
	}

	// Act
	_, err := NewBackendServer(t, config)

	// Assert: Should fail
	if err == nil {
		t.Error("Expected error for invalid kubeconfig, got nil")
	}
}

func TestGetFreePort(t *testing.T) {
	// Act
	port1, err := getFreePort()
	if err != nil {
		t.Fatalf("Failed to get free port: %v", err)
	}

	port2, err := getFreePort()
	if err != nil {
		t.Fatalf("Failed to get free port: %v", err)
	}

	// Assert: Ports should be different
	if port1 == port2 {
		t.Errorf("Expected different ports, got %d and %d", port1, port2)
	}

	// Assert: Ports should be valid
	if port1 < 1024 || port1 > 65535 {
		t.Errorf("Invalid port: %d", port1)
	}
	if port2 < 1024 || port2 > 65535 {
		t.Errorf("Invalid port: %d", port2)
	}
}
