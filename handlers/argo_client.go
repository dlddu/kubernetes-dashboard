package handlers

import (
	"sync"

	versioned "github.com/argoproj/argo-workflows/v3/pkg/client/clientset/versioned"
)

var (
	argoClient     *versioned.Clientset
	argoClientErr  error
	argoClientOnce sync.Once
)

// getArgoClient returns a cached Argo Workflows clientset, creating it on first call.
func getArgoClient() (*versioned.Clientset, error) {
	argoClientOnce.Do(func() {
		config, err := getRESTConfig()
		if err != nil {
			argoClientErr = err
			return
		}
		argoClient, argoClientErr = versioned.NewForConfig(config)
	})
	return argoClient, argoClientErr
}
