package handlers

import (
	"sync"

	versioned "github.com/fluxcd/kustomize-controller/v1/pkg/client/clientset/versioned"
)

var (
	fluxcdClient     *versioned.Clientset
	fluxcdClientErr  error
	fluxcdClientOnce sync.Once
)

// getFluxCDClient returns a cached FluxCD Kustomize Controller clientset, creating it on first call.
func getFluxCDClient() (*versioned.Clientset, error) {
	fluxcdClientOnce.Do(func() {
		config, err := getRESTConfig()
		if err != nil {
			fluxcdClientErr = err
			return
		}
		fluxcdClient, fluxcdClientErr = versioned.NewForConfig(config)
	})
	return fluxcdClient, fluxcdClientErr
}
