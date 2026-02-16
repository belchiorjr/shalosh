package userprofiles

import (
	"context"
	"net/http"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

type Handler struct {
	userProfileService  *usecase.UserProfileService
	authorizeRequest    func(r *http.Request) (infraauth.Claims, error)
	isUserAdministrator func(ctx context.Context, userID string) (bool, error)
	respondJSON         func(w http.ResponseWriter, status int, payload interface{})
	respondError        func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	userProfileService *usecase.UserProfileService,
	authorizeRequest func(r *http.Request) (infraauth.Claims, error),
	isUserAdministrator func(ctx context.Context, userID string) (bool, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		userProfileService:  userProfileService,
		authorizeRequest:    authorizeRequest,
		isUserAdministrator: isUserAdministrator,
		respondJSON:         respondJSON,
		respondError:        respondError,
	}
}
