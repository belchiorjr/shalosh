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

	application, err := app.New()
	if err != nil {
		log.Fatalf("startup error: %v", err)
	}
	defer func() {
		if err := application.Close(); err != nil {
			log.Printf("shutdown error: %v", err)
		}
	}()

	server := &http.Server{
		Addr:    ":" + port,
		Handler: application.Handler,
	}

	log.Printf("admin_backend listening on :%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
