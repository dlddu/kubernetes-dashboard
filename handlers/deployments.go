package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// DeploymentInfo represents detailed information about a deployment
type DeploymentInfo struct {
	Name               string `json:"name"`
	Namespace          string `json:"namespace"`
	Replicas           int32  `json:"replicas"`
	ReadyReplicas      int32  `json:"readyReplicas"`
	AvailableReplicas  int32  `json:"availableReplicas"`
}

// DeploymentsHandler handles the GET /api/deployments endpoint
func DeploymentsHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow GET method
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Get namespace from query parameter
	namespace := r.URL.Query().Get("ns")
	if namespace == "" {
		namespace = "" // Empty string means all namespaces
	}

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		// If client creation fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	// Fetch deployments data
	deployments, err := getDeploymentsData(clientset, namespace)
	if err != nil {
		// If fetching fails, return 500
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to fetch deployments data"})
		return
	}

	// Send response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(deployments)
}

// getDeploymentsData fetches deployments data from Kubernetes
func getDeploymentsData(clientset *kubernetes.Clientset, namespace string) ([]DeploymentInfo, error) {
	ctx := context.Background()

	// Fetch deployments
	deploymentList, err := clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Build deployments list with detailed information
	deploymentsData := make([]DeploymentInfo, 0, len(deploymentList.Items))

	for _, deployment := range deploymentList.Items {
		replicas := int32(0)
		if deployment.Spec.Replicas != nil {
			replicas = *deployment.Spec.Replicas
		}

		deploymentsData = append(deploymentsData, DeploymentInfo{
			Name:               deployment.Name,
			Namespace:          deployment.Namespace,
			Replicas:           replicas,
			ReadyReplicas:      deployment.Status.ReadyReplicas,
			AvailableReplicas:  deployment.Status.AvailableReplicas,
		})
	}

	return deploymentsData, nil
}

// DeploymentRestartHandler handles the POST /api/deployments/:ns/:name/restart endpoint
func DeploymentRestartHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST method
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Parse URL path to extract namespace and deployment name
	// Expected path: /api/deployments/:ns/:name/restart
	path := r.URL.Path
	path = strings.TrimPrefix(path, "/api/deployments/")
	path = strings.TrimSuffix(path, "/restart")

	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid path format"})
		return
	}

	namespace := parts[0]
	deploymentName := parts[1]

	// Validate parameters
	if namespace == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Namespace is required"})
		return
	}

	if deploymentName == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Deployment name is required"})
		return
	}

	// Get Kubernetes client
	clientset, err := getKubernetesClient()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create Kubernetes client"})
		return
	}

	// Restart the deployment
	err = restartDeployment(clientset, namespace, deploymentName)
	if err != nil {
		// Check if it's a NotFound error
		if strings.Contains(err.Error(), "not found") {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Deployment not found"})
			return
		}

		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Send success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Deployment restarted successfully",
	})
}

// restartDeployment restarts a deployment by adding/updating the restartedAt annotation
func restartDeployment(clientset *kubernetes.Clientset, namespace, deploymentName string) error {
	ctx := context.Background()

	// Get the deployment
	deployment, err := clientset.AppsV1().Deployments(namespace).Get(ctx, deploymentName, metav1.GetOptions{})
	if err != nil {
		return err
	}

	// Add or update the kubectl.kubernetes.io/restartedAt annotation
	if deployment.Spec.Template.Annotations == nil {
		deployment.Spec.Template.Annotations = make(map[string]string)
	}

	// Set the restartedAt annotation with current timestamp in RFC3339 format
	deployment.Spec.Template.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	// Update the deployment
	_, err = clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		return err
	}

	return nil
}
