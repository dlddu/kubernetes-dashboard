package server

import (
	"embed"
	"io"
	"io/fs"
	"mime"
	"net/http"
	"path/filepath"
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

	// Register "/" handler for both production and testing
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If path starts with /api, don't serve static files
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// If distSubFS is nil (during testing), return 404
		if distSubFS == nil {
			http.NotFound(w, r)
			return
		}

		// Try to serve the static file
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// Try to open the file
		file, err := distSubFS.Open(path)
		if err != nil {
			// Fallback to index.html for SPA routing
			path = "index.html"
			file, err = distSubFS.Open(path)
			if err != nil {
				http.NotFound(w, r)
				return
			}
		}
		defer file.Close()

		// Get file info for content type detection
		stat, err := file.Stat()
		if err != nil {
			http.NotFound(w, r)
			return
		}

		// If it's a directory, serve index.html
		if stat.IsDir() {
			path = "index.html"
			file.Close()
			file, err = distSubFS.Open(path)
			if err != nil {
				http.NotFound(w, r)
				return
			}
			defer file.Close()
			stat, _ = file.Stat()
		}

		// Determine content type
		contentType := mime.TypeByExtension(filepath.Ext(path))
		if contentType == "" {
			contentType = "application/octet-stream"
		}
		w.Header().Set("Content-Type", contentType)

		// Serve the file content
		http.ServeContent(w, r, path, stat.ModTime(), file.(io.ReadSeeker))
	})

	srv := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	return &Server{
		Server: srv,
	}
}
