package app

import (
	"context"
	"net/http"
	"time"

	"admin_backend/internal/infra/auth"
	"admin_backend/internal/infra/clock"
	"admin_backend/internal/infra/db"
	"admin_backend/internal/infra/id"
	"admin_backend/internal/infra/localstack"
	"admin_backend/internal/infra/repository/memory"
	"admin_backend/internal/infra/repository/postgres"
	"admin_backend/internal/infra/zipcode"
	apphttp "admin_backend/internal/interfaces/http"
	"admin_backend/internal/usecase"
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

	userRepo := memory.NewUserRepository()
	ids := id.New()
	clockProvider := clock.New()
	tokenManager := auth.NewTokenManager(auth.FromEnv())
	zipCodeLookup := zipcode.NewViaCEPClient(8 * time.Second)
	clientRepo := postgres.NewClientRepository(database)
	clientPortalRepo := postgres.NewClientPortalRepository(database)
	authRepo := postgres.NewAuthRepository(database)
	authorizationRepo := postgres.NewAuthorizationRepository(database)
	userProfileRepo := postgres.NewUserProfileRepository(database)
	securityRepo := postgres.NewSecurityRepository(database)
	projectRepo := postgres.NewProjectRepository(database)

	userService := usecase.NewUserService(userRepo, ids, clockProvider)
	clientService := usecase.NewClientService(clientRepo, zipCodeLookup)
	authService := usecase.NewAuthService(authRepo)
	authorizationService := usecase.NewAuthorizationService(authorizationRepo)
	userProfileService := usecase.NewUserProfileService(userProfileRepo)
	securityService := usecase.NewSecurityService(securityRepo)
	projectService := usecase.NewProjectService(projectRepo)
	clientPortalService := usecase.NewClientPortalService(clientPortalRepo)
	userHandler := apphttp.NewUserHandler(
		userService,
		clientService,
		authService,
		authorizationService,
		userProfileService,
		securityService,
		projectService,
		clientPortalService,
		database,
		tokenManager,
	)

	mux := http.NewServeMux()
	userHandler.RegisterRoutes(mux)
	handler := apphttp.WithCORS(mux)

	return &App{
		Handler:    handler,
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
