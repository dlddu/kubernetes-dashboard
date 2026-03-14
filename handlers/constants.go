package handlers

// API path prefixes used in URL parsing.
const (
	deploymentsPathPrefix = "/api/deployments/"
	secretsPathPrefix     = "/api/secrets/"
	podLogsPathPrefix     = "/api/pods/logs/"
	restartPathSuffix     = "/restart"
)

// Kubernetes annotation keys.
const (
	annotationRestartedAt = "kubectl.kubernetes.io/restartedAt"
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
)

// FluxCD API path prefixes.
const (
	fluxcdKustomizationsPathPrefix = "/api/fluxcd/kustomizations/"
)

// FluxCD error messages.
const (
	errMsgFluxCDClientCreate    = "Failed to create FluxCD client"
	errMsgKustomizationNotFound = "Kustomization not found"
	errMsgKustomizationFetch    = "Failed to fetch kustomization"
	errMsgKustomizationListFetch = "Failed to fetch kustomization list"
)
