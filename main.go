package main

import (
	"embed"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/dlddu/kubernetes-dashboard/handlers"
)

//go:embed frontend/dist
var frontendFS embed.FS

func main() {
	router := setupRouter()

	slog.Info("Starting server", "addr", ":8080")
	if err := http.ListenAndServe(":8080", router); err != nil {
		slog.Error("Server failed", "error", err)
		os.Exit(1)
	}
}

func setupRouter() http.Handler {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/health", handlers.HealthHandler)
	mux.HandleFunc("/api/namespaces", handlers.NamespacesHandler)
	mux.HandleFunc("/api/overview", handlers.OverviewHandler)
	mux.HandleFunc("/api/nodes", handlers.NodesHandler)
	mux.HandleFunc("/api/pods/unhealthy", handlers.UnhealthyPodsHandler)
	mux.HandleFunc("/api/pods/all", handlers.AllPodsHandler)
	mux.HandleFunc("/api/deployments", handlers.DeploymentsHandler)
	mux.HandleFunc("/api/deployments/", handlers.DeploymentRestartHandler)
	mux.HandleFunc("/api/secrets/", handlers.SecretDetailHandler)
	mux.HandleFunc("/api/secrets", handlers.SecretsHandler)
	mux.HandleFunc("/api/argo/workflow-templates", handlers.WorkflowTemplatesHandler)
	mux.HandleFunc("/api/argo/workflow-templates/", handlers.WorkflowSubmitHandler)
	mux.HandleFunc("/api/argo/workflows", handlers.WorkflowsHandler)
	mux.HandleFunc("/api/argo/workflows/", handlers.WorkflowDetailHandler)

	// Serve frontend static files
	frontendHandler := createFrontendHandler()
	mux.Handle("/", frontendHandler)

	return mux
}

func createFrontendHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't serve frontend for API routes
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Try to serve the frontend
		distFS, err := fs.Sub(frontendFS, "frontend/dist")
		if err != nil {
			// Frontend not built yet, return 404
			http.NotFound(w, r)
			return
		}

		// Create file server
		fileServer := http.FileServer(http.FS(distFS))

		// Try to open the requested file
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}

		// Check if file exists
		file, err := distFS.Open(strings.TrimPrefix(path, "/"))
		if err != nil {
			// File not found, serve index.html for SPA routing
			r.URL.Path = "/"
		} else {
			file.Close()
		}

		fileServer.ServeHTTP(w, r)
	})
}
