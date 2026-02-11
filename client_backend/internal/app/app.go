package app

import (
	"net/http"

	"client_backend/internal/infra/clock"
	"client_backend/internal/infra/id"
	"client_backend/internal/infra/repository/memory"
	apphttp "client_backend/internal/interfaces/http"
	"client_backend/internal/usecase"
)

type App struct {
	Handler http.Handler
}

func New() *App {
	clientRepo := memory.NewClientRepository()
	ids := id.New()
	clockProvider := clock.New()

	clientService := usecase.NewClientService(clientRepo, ids, clockProvider)
	clientHandler := apphttp.NewClientHandler(clientService)

	mux := http.NewServeMux()
	clientHandler.RegisterRoutes(mux)

	return &App{Handler: mux}
}
