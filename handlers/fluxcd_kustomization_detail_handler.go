package handlers

import (
	"context"
	"net/http"
	"strings"

	versioned "github.com/dlddu/kubernetes-dashboard/internal/fluxcdversioned/pkg/client/clientset/versioned"
)

// KustomizationDetailInfo represents the full detail view of a FluxCD Kustomization.
type KustomizationDetailInfo struct {
	Name      string                  `json:"name"`
	Namespace string                  `json:"namespace"`
	Suspended bool                    `json:"suspended"`
	Spec      KustomizationSpecInfo   `json:"spec"`
	Status    KustomizationStatusInfo `json:"status"`
}

// KustomizationSpecInfo represents the spec fields of a Kustomization.
type KustomizationSpecInfo struct {
	Interval  string       `json:"interval"`
	Path      string       `json:"path"`
	Prune     bool         `json:"prune"`
	SourceRef SourceRefInfo  `json:"sourceRef"`
	DependsOn []DependsOnRef `json:"dependsOn"`
}

// SourceRefInfo represents a source reference in a Kustomization spec.
type SourceRefInfo struct {
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
}

// DependsOnRef represents a dependency reference in a Kustomization spec.
type DependsOnRef struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
}

// KustomizationStatusInfo represents the status fields of a Kustomization.
type KustomizationStatusInfo struct {
	LastAppliedRevision string          `json:"lastAppliedRevision"`
	Conditions          []ConditionInfo `json:"conditions"`
}

// ConditionInfo represents a single condition of a Kustomization status.
type ConditionInfo struct {
	Type               string `json:"type"`
	Status             string `json:"status"`
	Reason             string `json:"reason"`
	Message            string `json:"message"`
	LastTransitionTime string `json:"lastTransitionTime"`
}

// KustomizationDetailHandler handles GET /api/fluxcd/kustomizations/{namespace}/{name}
func KustomizationDetailHandler(w http.ResponseWriter, r *http.Request) {
	r = withTimeout(r)

	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	namespace, name, err := parseResourcePath(r.URL.Path, fluxcdKustomizationsPathPrefix, "")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid path format. Expected /api/fluxcd/kustomizations/{namespace}/{name}")
		return
	}

	clientset, err := getFluxCDClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, errMsgFluxCDClientCreate)
		return
	}

	detail, err := getKustomizationDetail(r.Context(), clientset, namespace, name)
	if err != nil {
		if strings.Contains(err.Error(), "not found") ||
			strings.Contains(err.Error(), "Not Found") ||
			strings.Contains(err.Error(), "404") {
			writeError(w, http.StatusNotFound, errMsgKustomizationNotFound)
			return
		}
		writeError(w, http.StatusInternalServerError, errMsgKustomizationFetch)
		return
	}

	writeJSON(w, http.StatusOK, detail)
}

// getKustomizationDetail fetches a single Kustomization detail from the FluxCD clientset.
func getKustomizationDetail(ctx context.Context, clientset *versioned.Clientset, namespace, name string) (*KustomizationDetailInfo, error) {
	kd, err := clientset.FluxCDV1().Kustomizations(namespace).Get(ctx, name)
	if err != nil {
		return nil, err
	}

	conditions := make([]ConditionInfo, 0, len(kd.Status.Conditions))
	for _, c := range kd.Status.Conditions {
		conditions = append(conditions, ConditionInfo{
			Type:               c.Type,
			Status:             c.Status,
			Reason:             c.Reason,
			Message:            c.Message,
			LastTransitionTime: c.LastTransitionTime,
		})
	}

	return &KustomizationDetailInfo{
		Name:      kd.Name,
		Namespace: kd.Namespace,
		Suspended: kd.Suspended,
		Spec: KustomizationSpecInfo{
			Interval: kd.Spec.Interval,
			Path:     kd.Spec.Path,
			Prune:    kd.Spec.Prune,
			SourceRef: SourceRefInfo{
				Kind:      kd.Spec.SourceRef.Kind,
				Name:      kd.Spec.SourceRef.Name,
				Namespace: kd.Spec.SourceRef.Namespace,
			},
			DependsOn: []DependsOnRef{},
		},
		Status: KustomizationStatusInfo{
			LastAppliedRevision: kd.Status.LastAppliedRevision,
			Conditions:          conditions,
		},
	}, nil
}
