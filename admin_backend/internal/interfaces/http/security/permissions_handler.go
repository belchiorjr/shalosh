package security

import (
	"encoding/json"
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandlePermissions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		permissions, err := h.securityService.ListPermissions(r.Context())
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, permissions)
	case http.MethodPost:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var payload struct {
			Code        string `json:"code"`
			Name        string `json:"name"`
			Description string `json:"description"`
			Active      *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		permission, err := h.securityService.CreatePermission(r.Context(), usecase.CreatePermissionInput{
			Code:        payload.Code,
			Name:        payload.Name,
			Description: payload.Description,
			Active:      active,
		})
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "code and name are required")
			case errors.Is(err, usecase.ErrPermissionCodeInUse):
				h.respondError(w, http.StatusConflict, "permission code already in use")
			case errors.Is(err, usecase.ErrPermissionNameInUse):
				h.respondError(w, http.StatusConflict, "permission name already in use")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusCreated, permission)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
