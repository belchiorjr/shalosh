package auth

import (
	"net/http"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

type Handler struct {
	authService          *usecase.AuthService
	tokenManager         *infraauth.TokenManager
	authorizeRequest     func(r *http.Request) (infraauth.Claims, error)
	normalizeAvatarInput func(value string) (string, error)
	respondJSON          func(w http.ResponseWriter, status int, payload interface{})
	respondError         func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	authService *usecase.AuthService,
	tokenManager *infraauth.TokenManager,
	authorizeRequest func(r *http.Request) (infraauth.Claims, error),
	normalizeAvatarInput func(value string) (string, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		authService:          authService,
		tokenManager:         tokenManager,
		authorizeRequest:     authorizeRequest,
		normalizeAvatarInput: normalizeAvatarInput,
		respondJSON:          respondJSON,
		respondError:         respondError,
	}
}
