package handlers

import (
	"context"
	"net/http"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

// externalSecretsGVR is the GroupVersionResource used by the External Secrets Operator
// for the ExternalSecret CRD. v1 is the served/storage version as of ESO v0.18.
var externalSecretsGVR = schema.GroupVersionResource{
	Group:    "external-secrets.io",
	Version:  "v1",
	Resource: "externalsecrets",
}

// ExternalSecretInfo represents a summarised view of an ExternalSecret resource.
type ExternalSecretInfo struct {
	Name              string `json:"name"`
	Namespace         string `json:"namespace"`
	Ready             bool   `json:"ready"`
	Status            string `json:"status"`
	Reason            string `json:"reason"`
	Message           string `json:"message"`
	StoreKind         string `json:"storeKind"`
	StoreName         string `json:"storeName"`
	TargetName        string `json:"targetName"`
	RefreshInterval   string `json:"refreshInterval"`
	LastSyncTime      string `json:"lastSyncTime"`
	SyncedResourceVer string `json:"syncedResourceVersion"`
}

// ExternalSecretsHandler handles GET /api/external-secrets.
var ExternalSecretsHandler = handleGet(errMsgExternalSecretListFetch, func(r *http.Request) (interface{}, error) {
	client, err := getDynamicClient()
	if err != nil {
		// No cluster reachable → return empty list so the UI renders gracefully.
		return []ExternalSecretInfo{}, nil
	}
	namespace := r.URL.Query().Get("ns")
	return getExternalSecretsData(r.Context(), client, namespace)
})

func getExternalSecretsData(ctx context.Context, client dynamic.Interface, namespace string) ([]ExternalSecretInfo, error) {
	list, err := client.Resource(externalSecretsGVR).Namespace(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		// External Secrets Operator CRD가 설치되지 않은 클러스터에서는 빈 목록을 반환합니다.
		if strings.Contains(err.Error(), "the server could not find the requested resource") ||
			strings.Contains(strings.ToLower(err.Error()), "not found") {
			return []ExternalSecretInfo{}, nil
		}
		return nil, err
	}

	result := make([]ExternalSecretInfo, 0, len(list.Items))
	for _, item := range list.Items {
		result = append(result, parseExternalSecret(&item))
	}
	return result, nil
}

func parseExternalSecret(obj *unstructured.Unstructured) ExternalSecretInfo {
	info := ExternalSecretInfo{
		Name:      obj.GetName(),
		Namespace: obj.GetNamespace(),
		Status:    "Unknown",
	}

	// spec.secretStoreRef.{kind,name}
	storeKind, _, _ := unstructured.NestedString(obj.Object, "spec", "secretStoreRef", "kind")
	storeName, _, _ := unstructured.NestedString(obj.Object, "spec", "secretStoreRef", "name")
	if storeKind == "" {
		// Default kind per External Secrets Operator schema.
		storeKind = "SecretStore"
	}
	info.StoreKind = storeKind
	info.StoreName = storeName

	// spec.target.name (falls back to metadata.name when omitted)
	targetName, _, _ := unstructured.NestedString(obj.Object, "spec", "target", "name")
	if targetName == "" {
		targetName = obj.GetName()
	}
	info.TargetName = targetName

	// spec.refreshInterval
	if refresh, found, _ := unstructured.NestedString(obj.Object, "spec", "refreshInterval"); found {
		info.RefreshInterval = refresh
	}

	// status.refreshTime / status.syncedResourceVersion
	if syncTime, found, _ := unstructured.NestedString(obj.Object, "status", "refreshTime"); found {
		info.LastSyncTime = syncTime
	}
	if rv, found, _ := unstructured.NestedString(obj.Object, "status", "syncedResourceVersion"); found {
		info.SyncedResourceVer = rv
	}

	// status.conditions[type=Ready]
	conditions, found, _ := unstructured.NestedSlice(obj.Object, "status", "conditions")
	if found {
		for _, c := range conditions {
			cond, ok := c.(map[string]interface{})
			if !ok {
				continue
			}
			condType, _, _ := unstructured.NestedString(cond, "type")
			if condType != "Ready" {
				continue
			}
			condStatus, _, _ := unstructured.NestedString(cond, "status")
			info.Ready = condStatus == "True"
			if condStatus == "True" {
				info.Status = "Ready"
			} else {
				info.Status = "NotReady"
			}
			if reason, _, _ := unstructured.NestedString(cond, "reason"); reason != "" {
				info.Reason = reason
			}
			if msg, _, _ := unstructured.NestedString(cond, "message"); msg != "" {
				info.Message = msg
			}
			break
		}
	}

	return info
}
