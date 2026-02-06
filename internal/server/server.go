package server

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed dist
var distFS embed.FS

// Server represents the HTTP server
type Server struct {
	*http.Server
}

// NewServer creates a new HTTP server
func NewServer(addr string) *Server {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/health", HealthHandler)

	// Static file serving
	distSubFS, err := fs.Sub(distFS, "dist")
	if err != nil {
		// If dist folder doesn't exist (during testing), use empty FS
		distSubFS = nil
	}

	if distSubFS != nil {
		fileServer := http.FileServer(http.FS(distSubFS))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// If path starts with /api, don't serve static files
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}

			// Try to serve the static file
			path := strings.TrimPrefix(r.URL.Path, "/")
			if path == "" {
				path = "index.html"
			}

			// Check if file exists
			_, err := distSubFS.Open(path)
			if err != nil {
				// If file doesn't exist, serve index.html for client-side routing
				path = "index.html"
			}

			// Serve the file
			r.URL.Path = "/" + path
			fileServer.ServeHTTP(w, r)
		})
	}

	srv := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	return &Server{
		Server: srv,
	}
}
