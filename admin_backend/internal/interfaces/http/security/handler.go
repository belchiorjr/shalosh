package security

import (
	"context"
	"net/http"

	"admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

type Handler struct {
	securityService     *usecase.SecurityService
	authorizeRequest    func(r *http.Request) (auth.Claims, error)
	isUserAdministrator func(ctx context.Context, userID string) (bool, error)
	respondJSON         func(w http.ResponseWriter, status int, payload interface{})
	respondError        func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	securityService *usecase.SecurityService,
	authorizeRequest func(r *http.Request) (auth.Claims, error),
	isUserAdministrator func(ctx context.Context, userID string) (bool, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		securityService:     securityService,
		authorizeRequest:    authorizeRequest,
		isUserAdministrator: isUserAdministrator,
		respondJSON:         respondJSON,
		respondError:        respondError,
	}
}
