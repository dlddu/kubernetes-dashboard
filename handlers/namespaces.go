package handlers

import (
	"net/http"
	"sort"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// NamespacesHandler handles the /api/namespaces endpoint
var NamespacesHandler = handleGet("Failed to fetch namespaces", func(r *http.Request) (interface{}, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, err
	}

	namespaceList, err := clientset.CoreV1().Namespaces().List(r.Context(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	namespaces := make([]string, 0, len(namespaceList.Items))
	for _, ns := range namespaceList.Items {
		if ns.Name != "" {
			namespaces = append(namespaces, ns.Name)
		}
	}

	sort.Strings(namespaces)

	return namespaces, nil
})
