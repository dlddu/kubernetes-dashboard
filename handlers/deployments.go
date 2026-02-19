package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// DeploymentInfo represents detailed information about a deployment
type DeploymentInfo struct {
	Name              string `json:"name"`
	Namespace         string `json:"namespace"`
	Replicas          int32  `json:"replicas"`
	ReadyReplicas     int32  `json:"readyReplicas"`
	AvailableReplicas int32  `json:"availableReplicas"`
}

// DeploymentsHandler handles the GET /api/deployments endpoint
var DeploymentsHandler = handleGet("Failed to fetch deployments data", func(r *http.Request) (interface{}, error) {
	clientset, err := getKubernetesClient()
	if err != nil {
		return nil, err
	}
	namespace := r.URL.Query().Get("ns")
	return getDeploymentsData(r.Context(), clientset, namespace)
})

// getDeploymentsData fetches deployments data from Kubernetes
func getDeploymentsData(ctx context.Context, clientset *kubernetes.Clientset, namespace string) ([]DeploymentInfo, error) {
	deploymentList, err := clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	deploymentsData := make([]DeploymentInfo, 0, len(deploymentList.Items))
	for _, deployment := range deploymentList.Items {
		replicas := int32(0)
		if deployment.Spec.Replicas != nil {
			replicas = *deployment.Spec.Replicas
		}

		deploymentsData = append(deploymentsData, DeploymentInfo{
			Name:              deployment.Name,
			Namespace:         deployment.Namespace,
			Replicas:          replicas,
			ReadyReplicas:     deployment.Status.ReadyReplicas,
			AvailableReplicas: deployment.Status.AvailableReplicas,
		})
	}

	return deploymentsData, nil
}

// DeploymentRestartHandler handles the POST /api/deployments/:ns/:name/restart endpoint
func DeploymentRestartHandler(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	// Parse URL path to extract namespace and deployment name
	path := strings.TrimPrefix(r.URL.Path, "/api/deployments/")
	path = strings.TrimSuffix(path, "/restart")

	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		writeError(w, http.StatusBadRequest, "Invalid path format")
		return
	}

	namespace := parts[0]
	deploymentName := parts[1]

	if namespace == "" {
		writeError(w, http.StatusBadRequest, "Namespace is required")
		return
	}
	if deploymentName == "" {
		writeError(w, http.StatusBadRequest, "Deployment name is required")
		return
	}

	clientset, err := getKubernetesClient()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create Kubernetes client")
		return
	}

	err = restartDeployment(r.Context(), clientset, namespace, deploymentName)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			writeError(w, http.StatusNotFound, "Deployment not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "Deployment restarted successfully",
	})
}

// restartDeployment restarts a deployment by adding/updating the restartedAt annotation
func restartDeployment(ctx context.Context, clientset *kubernetes.Clientset, namespace, deploymentName string) error {
	deployment, err := clientset.AppsV1().Deployments(namespace).Get(ctx, deploymentName, metav1.GetOptions{})
	if err != nil {
		return err
	}

	if deployment.Spec.Template.Annotations == nil {
		deployment.Spec.Template.Annotations = make(map[string]string)
	}

	deployment.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	_, err = clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	return err
}
