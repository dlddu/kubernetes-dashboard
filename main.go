package main

import (
	"fmt"
	"log"
	"os"

	"github.com/kubernetes-dashboard/kubernetes-dashboard/internal/server"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	srv := server.NewServer(addr)

	log.Printf("Starting server on %s", addr)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
