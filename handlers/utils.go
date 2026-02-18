package handlers

import (
	"strings"

	corev1 "k8s.io/api/core/v1"
)

// isNodeReady checks if a node is ready
func isNodeReady(node corev1.Node) bool {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}

// getNodeRole extracts the role of a node from its labels.
// It checks two label formats:
//  1. "node.kubernetes.io/role" — the value is the role name
//  2. "node-role.kubernetes.io/<role>" — the key suffix is the role name
func getNodeRole(node corev1.Node) string {
	if role, exists := node.Labels["node.kubernetes.io/role"]; exists && role != "" {
		return role
	}

	const prefix = "node-role.kubernetes.io/"
	for key := range node.Labels {
		if strings.HasPrefix(key, prefix) {
			role := strings.TrimPrefix(key, prefix)
			if role != "" {
				return role
			}
		}
	}

	return ""
}

// isPodHealthy checks if a pod is healthy.
// A pod is considered unhealthy if:
//   - It's not in Running phase (except Succeeded), OR
//   - It has container issues (Waiting or Terminated state)
func isPodHealthy(pod corev1.Pod) bool {
	if pod.Status.Phase == corev1.PodSucceeded {
		return true
	}

	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Waiting != nil {
			return false
		}
		if containerStatus.State.Terminated != nil {
			return false
		}
	}

	return pod.Status.Phase == corev1.PodRunning
}

// getPodStatus returns the detailed status string for a pod.
// Checks container statuses first for more specific information
// (e.g., ImagePullBackOff, CrashLoopBackOff), then falls back to pod phase.
func getPodStatus(pod corev1.Pod) string {
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Waiting != nil {
			if reason := containerStatus.State.Waiting.Reason; reason != "" {
				return reason
			}
		}
		if containerStatus.State.Terminated != nil {
			if reason := containerStatus.State.Terminated.Reason; reason != "" {
				return reason
			}
		}
	}

	return string(pod.Status.Phase)
}

// clamp constrains a value between min and max.
func clamp(val, min, max float64) float64 {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}
