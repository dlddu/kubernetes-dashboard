package handlers

import (
	"sync"
	"testing"
)

// TestGetFluxCDClient tests that getFluxCDClient returns a FluxCD clientset.
func TestGetFluxCDClient(t *testing.T) {
	t.Run("should return non-nil clientset when REST config is available", func(t *testing.T) {
		skipIfNoCluster(t)

		// Act
		client, err := getFluxCDClient()

		// Assert
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if client == nil {
			t.Error("expected non-nil FluxCD clientset, got nil")
		}
	})

	t.Run("should return an error when no cluster is reachable", func(t *testing.T) {
		// This test is expected to run in CI without a real cluster.
		// getFluxCDClient must propagate the REST config error rather than panic.

		// Arrange: ensure the REST config failure path is exercised.
		// If a cluster happens to be present, skip this negative-path test.
		if _, err := getRESTConfig(); err == nil {
			t.Skip("skipping: cluster is reachable; negative-path test not applicable")
		}

		// Act
		client, err := getFluxCDClient()

		// Assert
		// A non-nil error is required; the clientset must be nil in this case.
		if err == nil {
			t.Error("expected an error when REST config cannot be obtained, got nil")
		}
		if client != nil {
			t.Errorf("expected nil clientset on error, got %v", client)
		}
	})
}

// TestGetFluxCDClientSingleton verifies that repeated calls return the identical instance.
func TestGetFluxCDClientSingleton(t *testing.T) {
	t.Run("should return the same clientset instance on repeated calls", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange & Act
		client1, err1 := getFluxCDClient()
		client2, err2 := getFluxCDClient()

		// Assert
		if err1 != nil {
			t.Fatalf("first call returned error: %v", err1)
		}
		if err2 != nil {
			t.Fatalf("second call returned error: %v", err2)
		}

		// Pointer equality confirms the singleton contract.
		if client1 != client2 {
			t.Errorf("expected the same clientset pointer on repeated calls: %p != %p", client1, client2)
		}
	})

	t.Run("should return the same error on repeated calls when init failed", func(t *testing.T) {
		// If a cluster is reachable this path cannot be tested; skip.
		if _, err := getRESTConfig(); err == nil {
			t.Skip("skipping: cluster is reachable; repeated-error-path test not applicable")
		}

		// Act
		_, err1 := getFluxCDClient()
		_, err2 := getFluxCDClient()

		// Assert: both calls must report an error (error is cached by sync.Once).
		if err1 == nil || err2 == nil {
			t.Error("expected both calls to return an error when REST config is unavailable")
		}
	})
}

// TestGetFluxCDClientConcurrency verifies the singleton is safe under concurrent access.
// Run with: go test -v -race ./handlers/ -run TestGetFluxCDClientConcurrency
func TestGetFluxCDClientConcurrency(t *testing.T) {
	t.Run("should be safe when called concurrently by multiple goroutines", func(t *testing.T) {
		// Arrange
		const numGoroutines = 50
		results := make([]interface{}, numGoroutines) // holds *versioned.Clientset or nil
		errors := make([]error, numGoroutines)

		var wg sync.WaitGroup
		wg.Add(numGoroutines)

		// Act: launch all goroutines simultaneously.
		start := make(chan struct{})
		for i := 0; i < numGoroutines; i++ {
			i := i
			go func() {
				defer wg.Done()
				<-start // wait for the signal so all goroutines start at once
				c, err := getFluxCDClient()
				results[i] = c
				errors[i] = err
			}()
		}
		close(start) // release all goroutines at the same time
		wg.Wait()

		// Assert: every goroutine must receive the same outcome.
		firstClient := results[0]
		firstErr := errors[0]

		for i := 1; i < numGoroutines; i++ {
			if results[i] != firstClient {
				t.Errorf("goroutine %d received a different clientset pointer: %p != %p", i, results[i], firstClient)
			}
			// Both error values must either be nil together or non-nil together.
			if (errors[i] == nil) != (firstErr == nil) {
				t.Errorf("goroutine %d returned inconsistent error: got %v, want %v", i, errors[i], firstErr)
			}
		}
	})

	t.Run("should initialise exactly once even under concurrent load", func(t *testing.T) {
		// This test verifies that sync.Once guarantees single initialisation.
		// We cannot directly inspect the Once counter, but we can confirm that
		// all concurrent callers receive a pointer-equal result, which is only
		// possible if the factory was called exactly once.
		skipIfNoCluster(t)

		const numGoroutines = 100
		clients := make([]interface{}, numGoroutines)

		var wg sync.WaitGroup
		wg.Add(numGoroutines)

		start := make(chan struct{})
		for i := 0; i < numGoroutines; i++ {
			i := i
			go func() {
				defer wg.Done()
				<-start
				c, _ := getFluxCDClient()
				clients[i] = c
			}()
		}
		close(start)
		wg.Wait()

		// All returned pointers must be identical.
		first := clients[0]
		if first == nil {
			t.Fatal("expected non-nil clientset from getFluxCDClient")
		}
		for i := 1; i < numGoroutines; i++ {
			if clients[i] != first {
				t.Errorf("goroutine %d received a different instance (%p != %p)", i, clients[i], first)
			}
		}
	})
}

// TestGetFluxCDClientUsesRESTConfig verifies that getFluxCDClient internally
// delegates to getRESTConfig for cluster configuration.
func TestGetFluxCDClientUsesRESTConfig(t *testing.T) {
	t.Run("should propagate REST config error as clientset error", func(t *testing.T) {
		// When getRESTConfig fails, getFluxCDClient must surface that same error.
		_, restErr := getRESTConfig()
		_, fluxErr := getFluxCDClient()

		if restErr != nil && fluxErr == nil {
			t.Error("getFluxCDClient should return an error when getRESTConfig fails, but it returned nil")
		}
		if restErr == nil && fluxErr != nil {
			t.Errorf("getFluxCDClient returned an unexpected error while getRESTConfig succeeded: %v", fluxErr)
		}
	})

	t.Run("should succeed when getRESTConfig succeeds", func(t *testing.T) {
		skipIfNoCluster(t)

		// Arrange: confirm REST config is available.
		_, restErr := getRESTConfig()
		if restErr != nil {
			t.Fatalf("prerequisite failed: getRESTConfig returned error: %v", restErr)
		}

		// Act
		client, err := getFluxCDClient()

		// Assert
		if err != nil {
			t.Errorf("expected nil error when REST config is available, got %v", err)
		}
		if client == nil {
			t.Error("expected non-nil clientset when REST config is available")
		}
	})
}
