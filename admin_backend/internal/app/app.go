package app

import (
	"context"
	"database/sql"
	"net/http"

	"admin_backend/internal/infra/clock"
	"admin_backend/internal/infra/db"
	"admin_backend/internal/infra/id"
	"admin_backend/internal/infra/localstack"
	"admin_backend/internal/infra/repository/memory"
	apphttp "admin_backend/internal/interfaces/http"
	"admin_backend/internal/usecase"
)

type App struct {
	Handler    http.Handler
	DB         *sql.DB
	Localstack *localstack.Client
}

func New() (*App, error) {
	ctx := context.Background()

	dbConfig := db.FromEnv()
	database, err := db.Connect(ctx, dbConfig)
	if err != nil {
		return nil, err
	}
	if err := db.Migrate(ctx, database, db.Migrations); err != nil {
		_ = database.Close()
		return nil, err
	}

	localstackConfig := localstack.FromEnv()
	localstackClient, err := localstack.New(localstackConfig)
	if err != nil {
		_ = database.Close()
		return nil, err
	}
	if err := localstackClient.HealthCheck(ctx); err != nil {
		_ = database.Close()
		return nil, err
	}

	userRepo := memory.NewUserRepository()
	ids := id.New()
	clockProvider := clock.New()

	userService := usecase.NewUserService(userRepo, ids, clockProvider)
	userHandler := apphttp.NewUserHandler(userService)

	mux := http.NewServeMux()
	userHandler.RegisterRoutes(mux)

	return &App{
		Handler:    mux,
		DB:         database,
		Localstack: localstackClient,
	}, nil
}

func (a *App) Close() error {
	if a.DB != nil {
		return a.DB.Close()
	}
	return nil
}
