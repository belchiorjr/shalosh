package main

import (
	"log"
	"net/http"
	"os"

	"admin_backend/internal/app"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	application := app.New()

	server := &http.Server{
		Addr:    ":" + port,
		Handler: application.Handler,
	}

	log.Printf("admin_backend listening on :%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
