package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	user, err := h.authService.Authenticate(r.Context(), payload.Login, payload.Password)
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "login and password are required")
			case errors.Is(err, usecase.ErrInvalidCredentials):
				h.respondError(w, http.StatusUnauthorized, "credenciais inválidas")
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
