package users

import (
	"net/http"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
)

type Handler struct {
	service              *usecase.UserService
	db                   *sqlx.DB
	authorizeRequest     func(r *http.Request) (infraauth.Claims, error)
	normalizeAvatarInput func(value string) (string, error)
	handleUserProfiles   func(w http.ResponseWriter, r *http.Request, userID string)
	respondJSON          func(w http.ResponseWriter, status int, payload interface{})
	respondError         func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	service *usecase.UserService,
	db *sqlx.DB,
	authorizeRequest func(r *http.Request) (infraauth.Claims, error),
	normalizeAvatarInput func(value string) (string, error),
	handleUserProfiles func(w http.ResponseWriter, r *http.Request, userID string),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		service:              service,
		db:                   db,
		authorizeRequest:     authorizeRequest,
		normalizeAvatarInput: normalizeAvatarInput,
		handleUserProfiles:   handleUserProfiles,
		respondJSON:          respondJSON,
		respondError:         respondError,
	}
}
