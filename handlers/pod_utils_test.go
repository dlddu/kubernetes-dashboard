package handlers

import (
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestGetPodStatus(t *testing.T) {
	now := metav1.NewTime(time.Now())

	tests := []struct {
		name     string
		pod      corev1.Pod
		expected string
	}{
		{
			name: "should return Terminating when deletionTimestamp is set",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					DeletionTimestamp: &now,
				},
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
				},
			},
			expected: "Terminating",
		},
		{
			name: "should return Terminating even when pod has container issues",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					DeletionTimestamp: &now,
				},
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Waiting: &corev1.ContainerStateWaiting{
									Reason: "CrashLoopBackOff",
								},
							},
						},
					},
				},
			},
			expected: "Terminating",
		},
		{
			name: "should return Running for healthy running pod",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
				},
			},
			expected: "Running",
		},
		{
			name: "should return container waiting reason",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodPending,
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Waiting: &corev1.ContainerStateWaiting{
									Reason: "ImagePullBackOff",
								},
							},
						},
					},
				},
			},
			expected: "ImagePullBackOff",
		},
		{
			name: "should return Succeeded for succeeded pod",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodSucceeded,
				},
			},
			expected: "Succeeded",
		},
		{
			name: "should return Completed for succeeded pod with Completed container reason",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodSucceeded,
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Terminated: &corev1.ContainerStateTerminated{
									ExitCode: 0,
									Reason:   "Completed",
								},
							},
						},
					},
				},
			},
			expected: "Completed",
		},
		{
			name: "should return Failed for failed pod",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodFailed,
				},
			},
			expected: "Failed",
		},
		{
			name: "should return Pending for pending pod",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodPending,
				},
			},
			expected: "Pending",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getPodStatus(tt.pod)
			if result != tt.expected {
				t.Errorf("getPodStatus() = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestIsPodHealthy(t *testing.T) {
	now := metav1.NewTime(time.Now())

	tests := []struct {
		name     string
		pod      corev1.Pod
		expected bool
	}{
		{
			name: "should return false when deletionTimestamp is set",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					DeletionTimestamp: &now,
				},
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
				},
			},
			expected: false,
		},
		{
			name: "should return false when deletionTimestamp is set even for succeeded pod",
			pod: corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					DeletionTimestamp: &now,
				},
				Status: corev1.PodStatus{
					Phase: corev1.PodSucceeded,
				},
			},
			expected: false,
		},
		{
			name: "should return true for running pod",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
				},
			},
			expected: true,
		},
		{
			name: "should return true for succeeded pod",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodSucceeded,
				},
			},
			expected: true,
		},
		{
			name: "should return false for pod with waiting container",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Waiting: &corev1.ContainerStateWaiting{
									Reason: "CrashLoopBackOff",
								},
							},
						},
					},
				},
			},
			expected: false,
		},
		{
			name: "should return false for pending pod",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodPending,
				},
			},
			expected: false,
		},
		{
			name: "should return true for running pod with completed container (exit code 0)",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Terminated: &corev1.ContainerStateTerminated{
									Reason:   "Completed",
									ExitCode: 0,
								},
							},
						},
					},
				},
			},
			expected: true,
		},
		{
			name: "should return false for running pod with failed container (non-zero exit code)",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodRunning,
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Terminated: &corev1.ContainerStateTerminated{
									Reason:   "Error",
									ExitCode: 1,
								},
							},
						},
					},
				},
			},
			expected: false,
		},
		{
			name: "should return true for succeeded pod with terminated containers",
			pod: corev1.Pod{
				Status: corev1.PodStatus{
					Phase: corev1.PodSucceeded,
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Terminated: &corev1.ContainerStateTerminated{
									Reason:   "Completed",
									ExitCode: 0,
								},
							},
						},
					},
				},
			},
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isPodHealthy(tt.pod)
			if result != tt.expected {
				t.Errorf("isPodHealthy() = %v, want %v", result, tt.expected)
			}
		})
	}
}
