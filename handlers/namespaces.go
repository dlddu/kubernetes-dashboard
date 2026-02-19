package handlers

import (
	"net/http"
	"sort"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// NamespacesHandler handles the /api/namespaces endpoint
func NamespacesHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodGet) {
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	namespaceList, err := clientset.CoreV1().Namespaces().List(r.Context(), metav1.ListOptions{})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch namespaces")
		return
	}

	namespaces := make([]string, 0, len(namespaceList.Items))
	for _, ns := range namespaceList.Items {
		if ns.Name != "" {
			namespaces = append(namespaces, ns.Name)
		}
	}

	sort.Strings(namespaces)

	writeJSON(w, http.StatusOK, namespaces)
}
