package handlers

import (
	"context"
	"net/http"
	"strings"

	versioned "github.com/dlddu/kubernetes-dashboard/internal/fluxcdversioned/pkg/client/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// KustomizationInfo represents a summarised view of a FluxCD Kustomization.
type KustomizationInfo struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	Ready       bool   `json:"ready"`
	Suspended   bool   `json:"suspended"`
	SourceKind  string `json:"sourceKind"`
	SourceName  string `json:"sourceName"`
	Revision    string `json:"revision"`
	Interval    string `json:"interval"`
	LastApplied string `json:"lastApplied"`
	Path        string `json:"path"`
}

// KustomizationsHandler handles the GET /api/fluxcd/kustomizations endpoint.
var KustomizationsHandler = handleGet(errMsgKustomizationListFetch, func(r *http.Request) (interface{}, error) {
	clientset, err := getFluxCDClient()
	if err != nil {
		// FluxCD client creation failure (no cluster) → return empty list
		return []KustomizationInfo{}, nil
	}
	namespace := r.URL.Query().Get("ns")
	return getKustomizationsData(r.Context(), clientset, namespace)
})

// getKustomizationsData fetches Kustomization data from FluxCD.
func getKustomizationsData(ctx context.Context, clientset *versioned.Clientset, namespace string) ([]KustomizationInfo, error) {
	kustomizationList, err := clientset.FluxCDV1().Kustomizations(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		// FluxCD CRD가 설치되지 않은 클러스터에서는 빈 목록을 반환합니다.
		if strings.Contains(err.Error(), "the server could not find the requested resource") ||
			strings.Contains(strings.ToLower(err.Error()), "not found") {
			return []KustomizationInfo{}, nil
		}
		return nil, err
	}

	result := make([]KustomizationInfo, 0, len(kustomizationList.Items))
	for _, k := range kustomizationList.Items {
		ready := false
		suspended := k.Suspended
		lastApplied := ""

		for _, cond := range k.Status.Conditions {
			if cond.Type == "Ready" {
				if cond.Status == "True" {
					ready = true
				}
				if cond.Reason == "Suspended" {
					suspended = true
				}
				if lastApplied == "" {
					lastApplied = cond.LastTransitionTime
				}
			}
		}

		result = append(result, KustomizationInfo{
			Name:        k.Name,
			Namespace:   k.Namespace,
			Ready:       ready,
			Suspended:   suspended,
			SourceKind:  k.Spec.SourceRef.Kind,
			SourceName:  k.Spec.SourceRef.Name,
			Revision:    k.Status.LastAppliedRevision,
			Interval:    k.Spec.Interval,
			LastApplied: lastApplied,
			Path:        k.Spec.Path,
		})
	}

	return result, nil
}
