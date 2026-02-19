package handlers

import (
	corev1 "k8s.io/api/core/v1"
)

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

	if pod.Status.Phase == corev1.PodSucceeded {
		return "Succeeded"
	}
	if pod.Status.Phase == corev1.PodFailed {
		return "Failed"
	}
	if pod.Status.Phase == corev1.PodUnknown {
		return "Unknown"
	}
	if pod.Status.Phase == corev1.PodPending {
		return "Pending"
	}

	return string(pod.Status.Phase)
}
