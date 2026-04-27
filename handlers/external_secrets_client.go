package handlers

import (
	"sync"

	"k8s.io/client-go/dynamic"
)

var (
	dynamicClient     dynamic.Interface
	dynamicClientErr  error
	dynamicClientOnce sync.Once
)

// getDynamicClient returns a cached dynamic Kubernetes client, creating it on first call.
// The dynamic client is used for CRDs that don't have a generated typed clientset
// (e.g. External Secrets Operator's ExternalSecret resource).
func getDynamicClient() (dynamic.Interface, error) {
	dynamicClientOnce.Do(func() {
		config, err := getRESTConfig()
		if err != nil {
			dynamicClientErr = err
			return
		}
		dynamicClient, dynamicClientErr = dynamic.NewForConfig(config)
	})
	return dynamicClient, dynamicClientErr
}
