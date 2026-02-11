package app

import (
	"net/http"

	"admin_backend/internal/infra/clock"
	"admin_backend/internal/infra/id"
	"admin_backend/internal/infra/repository/memory"
	apphttp "admin_backend/internal/interfaces/http"
	"admin_backend/internal/usecase"
)

type App struct {
	Handler http.Handler
}

func New() *App {
	userRepo := memory.NewUserRepository()
	ids := id.New()
	clockProvider := clock.New()

	userService := usecase.NewUserService(userRepo, ids, clockProvider)
	userHandler := apphttp.NewUserHandler(userService)

	mux := http.NewServeMux()
	userHandler.RegisterRoutes(mux)

	return &App{Handler: mux}
}
