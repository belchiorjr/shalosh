package security

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandlePermissionByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/permissions/")
	if id == "" || strings.Contains(id, "/") {
		h.respondError(w, http.StatusNotFound, "permission not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		permission, err := h.securityService.GetPermissionByID(r.Context(), id)
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrNotFound):
				h.respondError(w, http.StatusNotFound, "permission not found")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusOK, permission)
	case http.MethodPatch:
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

		permission, err := h.securityService.UpdatePermission(r.Context(), usecase.UpdatePermissionInput{
			ID:          id,
			Code:        payload.Code,
			Name:        payload.Name,
			Description: payload.Description,
			Active:      payload.Active,
		})
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "code and name are required")
			case errors.Is(err, usecase.ErrNotFound):
				h.respondError(w, http.StatusNotFound, "permission not found")
			case errors.Is(err, usecase.ErrPermissionCodeInUse):
				h.respondError(w, http.StatusConflict, "permission code already in use")
			case errors.Is(err, usecase.ErrPermissionNameInUse):
				h.respondError(w, http.StatusConflict, "permission name already in use")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusOK, permission)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
