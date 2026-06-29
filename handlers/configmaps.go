package handlers

import (
	"context"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// ConfigMapInfo represents config map information without values (for list endpoint)
type ConfigMapInfo struct {
	Name      string   `json:"name"`
	Namespace string   `json:"namespace"`
	Keys      []string `json:"keys"`
}

// ConfigMapDetail represents config map information with values (for detail endpoint)
type ConfigMapDetail struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Data      map[string]string `json:"data"`
}

// ConfigMapsHandler handles the GET /api/configmaps endpoint
var ConfigMapsHandler = handleGet("Failed to fetch configmaps data", func(r *http.Request) (interface{}, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, err
	}
	namespace := r.URL.Query().Get("ns")
	return getConfigMapsData(r.Context(), clientset, namespace)
})

// ConfigMapDetailHandler handles the GET /api/configmaps/:ns/:name endpoint
func ConfigMapDetailHandler(w http.ResponseWriter, r *http.Request) {
	r = withTimeout(r)

	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	rc := withParsedResource(w, r, configMapsPathPrefix, "")
	if rc == nil {
		return
	}

	configMapDetail, err := getConfigMapDetail(r.Context(), rc.clientset, rc.namespace, rc.name)
	if err != nil {
		writeResourceError(w, err, errMsgConfigMapNotFound, errMsgConfigMapFetch)
		return
	}

	writeJSON(w, http.StatusOK, configMapDetail)
}

// getConfigMapsData fetches config maps data from Kubernetes (without values)
func getConfigMapsData(ctx context.Context, clientset *kubernetes.Clientset, namespace string) ([]ConfigMapInfo, error) {
	configMapList, err := clientset.CoreV1().ConfigMaps(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	configMaps := make([]ConfigMapInfo, 0, len(configMapList.Items))
	for _, configMap := range configMapList.Items {
		keys := make([]string, 0, len(configMap.Data))
		for key := range configMap.Data {
			keys = append(keys, key)
		}

		configMaps = append(configMaps, ConfigMapInfo{
			Name:      configMap.Name,
			Namespace: configMap.Namespace,
			Keys:      keys,
		})
	}

	return configMaps, nil
}

// getConfigMapDetail fetches a specific config map with its values
func getConfigMapDetail(ctx context.Context, clientset *kubernetes.Clientset, namespace, name string) (*ConfigMapDetail, error) {
	configMap, err := clientset.CoreV1().ConfigMaps(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	data := make(map[string]string)
	for key, value := range configMap.Data {
		data[key] = value
	}

	return &ConfigMapDetail{
		Name:      configMap.Name,
		Namespace: configMap.Namespace,
		Data:      data,
	}, nil
}
