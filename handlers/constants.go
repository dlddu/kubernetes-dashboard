package handlers

// API path prefixes used in URL parsing.
const (
	deploymentsPathPrefix = "/api/deployments/"
	secretsPathPrefix     = "/api/secrets/"
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
	nodeStatusReady    = "Ready"
	nodeStatusNotReady = "NotReady"
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
)
