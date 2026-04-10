package handlers

// API path prefixes used in URL parsing.
const (
	deploymentsPathPrefix = "/api/deployments/"
	secretsPathPrefix     = "/api/secrets/"
	podLogsPathPrefix     = "/api/pods/logs/"
	restartPathSuffix     = "/restart"
	reconcilePathSuffix    = "/reconcile"
	updateBranchPathSuffix = "/update-branch"
	branchesPathSuffix     = "/branches"
	suspendPathSuffix      = "/suspend"
	resumePathSuffix       = "/resume"
	resubmitPathSuffix     = "/resubmit"
)

// Kubernetes annotation keys.
const (
	annotationRestartedAt          = "kubectl.kubernetes.io/restartedAt"
	annotationReconcileRequestedAt = "reconcile.fluxcd.io/requestedAt"
)

// Node role label keys.
const (
	labelNodeRole       = "node.kubernetes.io/role"
	labelNodeRolePrefix = "node-role.kubernetes.io/"
)

// Node status strings.
const (
	nodeStatusReady                 = "Ready"
	nodeStatusNotReady              = "NotReady"
	nodeStatusReadyScheduleDisabled = "Ready,SchedulingDisabled"
)

// Pod node assignment placeholder.
const podNodePending = "Pending"

// Common error messages used across handlers.
const (
	errMsgClientCreate = "Failed to create Kubernetes client"

	errMsgSecretNotFound  = "Secret not found"
	errMsgSecretFetch     = "Failed to fetch secret detail"
	errMsgSecretDelete    = "Failed to delete secret"

	errMsgDeploymentNotFound = "Deployment not found"

	errMsgPodNotFound  = "Pod not found"
	errMsgPodLogsFetch = "Failed to fetch pod logs"
	errMsgPodDelete    = "Failed to delete pod"
	errMsgPodCleanup   = "Failed to cleanup pods"

	errMsgWorkflowNotFound  = "Workflow not found"
	errMsgWorkflowDelete    = "Failed to delete workflow"
	errMsgWorkflowResubmit  = "Failed to resubmit workflow"
)

// FluxCD API path prefixes.
const (
	fluxcdKustomizationsPathPrefix  = "/api/fluxcd/kustomizations/"
	fluxcdGitRepositoriesPathPrefix = "/api/fluxcd/gitrepositories/"
)

// FluxCD error messages.
const (
	errMsgFluxCDClientCreate     = "Failed to create FluxCD client"
	errMsgKustomizationNotFound  = "Kustomization not found"
	errMsgKustomizationFetch     = "Failed to fetch kustomization"
	errMsgKustomizationListFetch = "Failed to fetch kustomization list"
	errMsgKustomizationReconcile = "Failed to reconcile kustomization"
	errMsgKustomizationSuspend   = "Failed to suspend kustomization"
	errMsgKustomizationResume    = "Failed to resume kustomization"

	errMsgGitRepositoryNotFound  = "GitRepository not found"
	errMsgGitRepositoryFetch     = "Failed to fetch git repository"
	errMsgGitRepositoryListFetch = "Failed to fetch git repository list"
	errMsgGitRepositoryReconcile    = "Failed to reconcile git repository"
	errMsgGitRepositoryUpdateBranch = "Failed to update git repository branch"
	errMsgGitRepositoryBranches     = "Failed to fetch git repository branches"
)
