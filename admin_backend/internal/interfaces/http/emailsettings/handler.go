package emailsettings

import (
	"context"
	"net/http"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

const (
	permissionEmailSettingsRead   = "email_settings.read"
	permissionEmailSettingsUpdate = "email_settings.update"
)

type Handler struct {
	emailSettingsService *usecase.EmailSettingsService
	authorizeRequest     func(r *http.Request) (infraauth.Claims, error)
	hasUserPermission    func(ctx context.Context, userID, permissionCode string) (bool, error)
	respondJSON          func(w http.ResponseWriter, status int, payload interface{})
	respondError         func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	emailSettingsService *usecase.EmailSettingsService,
	authorizeRequest func(r *http.Request) (infraauth.Claims, error),
	hasUserPermission func(ctx context.Context, userID, permissionCode string) (bool, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		emailSettingsService: emailSettingsService,
		authorizeRequest:     authorizeRequest,
		hasUserPermission:    hasUserPermission,
		respondJSON:          respondJSON,
		respondError:         respondError,
	}
}

func (h *Handler) authorize(
	w http.ResponseWriter,
	r *http.Request,
	permissionCode string,
) (string, bool) {
	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return "", false
	}

	allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionCode)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return "", false
	}
	if !allowed {
		h.respondError(w, http.StatusForbidden, "forbidden")
		return "", false
	}

	return claims.Sub, true
}
