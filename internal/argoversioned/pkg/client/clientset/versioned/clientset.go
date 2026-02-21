// Package versioned provides a stub Argo Workflows versioned clientset
// for use by kubernetes-dashboard.
package versioned

import (
	"k8s.io/client-go/rest"
)

// Clientset implements a minimal Argo Workflows clientset stub.
type Clientset struct {
	config *rest.Config
}

// NewForConfig creates a new Argo Workflows Clientset from the given REST config.
func NewForConfig(config *rest.Config) (*Clientset, error) {
	return &Clientset{config: config}, nil
}

// NewForConfigOrDie creates a new Argo Workflows Clientset from the given REST
// config or panics if an error occurs.
func NewForConfigOrDie(config *rest.Config) *Clientset {
	cs, err := NewForConfig(config)
	if err != nil {
		panic(err)
	}
	return cs
}
