package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var payload struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Login    string `json:"login"`
		Password string `json:"password"`
		Phone    string `json:"phone"`
		Address  string `json:"address"`
		Avatar   string `json:"avatar"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	avatar, err := h.normalizeAvatarInput(payload.Avatar)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.authService.UpdateOwnAccount(r.Context(), usecase.UpdateAccountInput{
		UserID:   claims.Sub,
		Name:     strings.TrimSpace(payload.Name),
		Email:    strings.TrimSpace(payload.Email),
		Login:    strings.ToLower(strings.TrimSpace(payload.Login)),
		Password: strings.TrimSpace(payload.Password),
		Phone:    strings.TrimSpace(payload.Phone),
		Address:  strings.TrimSpace(payload.Address),
		Avatar:   avatar,
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidInput):
			h.respondError(w, http.StatusBadRequest, "name, email and login are required")
		case errors.Is(err, usecase.ErrUnauthorized):
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
		case errors.Is(err, usecase.ErrEmailInUse):
			h.respondError(w, http.StatusConflict, "email already in use")
		case errors.Is(err, usecase.ErrLoginInUse):
			h.respondError(w, http.StatusConflict, "login already in use")
		case errors.Is(err, usecase.ErrConflict):
			h.respondError(w, http.StatusConflict, "conflict")
		default:
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
		}
		return
	}

	token, expiresAt, err := h.tokenManager.Generate(user.ID, user.Login, user.Name, time.Now())
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":     token,
		"tokenType": "Bearer",
		"expiresAt": expiresAt.UTC().Format(time.RFC3339),
		"user": map[string]interface{}{
			"id":      user.ID,
			"name":    user.Name,
			"email":   user.Email,
			"login":   user.Login,
			"phone":   user.Phone,
			"address": user.Address,
			"avatar":  user.Avatar,
			"active":  user.Active,
		},
	})
}
