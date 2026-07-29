package app

import (
	"context"
	"net/http"

	"client_backend/internal/infra/clock"
	"client_backend/internal/infra/db"
	"client_backend/internal/infra/id"
	"client_backend/internal/infra/localstack"
	"client_backend/internal/infra/repository/memory"
	apphttp "client_backend/internal/interfaces/http"
	"client_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
)

type App struct {
	Handler    http.Handler
	DB         *sqlx.DB
	Localstack *localstack.Client
}

func New() (*App, error) {
	ctx := context.Background()

	dbConfig := db.FromEnv()
	if err := db.EnsureDatabase(ctx, dbConfig); err != nil {
		return nil, err
	}
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

	clientRepo := memory.NewClientRepository()
	ids := id.New()
	clockProvider := clock.New()

	clientService := usecase.NewClientService(clientRepo, ids, clockProvider)
	clientHandler := apphttp.NewClientHandler(clientService)

	mux := http.NewServeMux()
	clientHandler.RegisterRoutes(mux)

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
