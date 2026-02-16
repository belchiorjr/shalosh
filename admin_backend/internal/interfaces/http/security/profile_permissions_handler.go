package security

import (
	"encoding/json"
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProfilePermissions(w http.ResponseWriter, r *http.Request, profileID string) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		permissionIDs, err := h.securityService.ListProfilePermissionIDs(r.Context(), profileID)
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"profileId":     profileID,
			"permissionIds": permissionIDs,
		})
	case http.MethodPut:
		claims, err := h.authorizeRequest(r)
		if err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		isAdministrator, err := h.isUserAdministrator(r.Context(), claims.Sub)
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !isAdministrator {
			h.respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		var payload struct {
			PermissionIDs []string `json:"permissionIds"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		normalizedPermissionIDs, err := h.securityService.SaveProfilePermissionIDs(
			r.Context(),
			profileID,
			payload.PermissionIDs,
		)
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrNotFound):
				h.respondError(w, http.StatusNotFound, "profile not found")
			case errors.Is(err, usecase.ErrPermissionsNotFound):
				h.respondError(w, http.StatusBadRequest, "one or more permissions do not exist")
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "invalid input")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"profileId":     profileID,
			"permissionIds": normalizedPermissionIDs,
		})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
