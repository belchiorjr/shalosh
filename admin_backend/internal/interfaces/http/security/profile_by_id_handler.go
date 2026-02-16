package security

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleProfileByID(w http.ResponseWriter, r *http.Request) {
	trimmedPath := strings.TrimPrefix(r.URL.Path, "/profiles/")
	if trimmedPath == "" {
		h.respondError(w, http.StatusNotFound, "profile not found")
		return
	}

	pathParts := strings.Split(trimmedPath, "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		h.respondError(w, http.StatusNotFound, "profile not found")
		return
	}

	profileID := pathParts[0]
	if len(pathParts) == 2 && pathParts[1] == "permissions" {
		h.handleProfilePermissions(w, r, profileID)
		return
	}
	if len(pathParts) > 1 {
		h.respondError(w, http.StatusNotFound, "profile not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		profile, err := h.securityService.GetProfileByID(r.Context(), profileID)
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrNotFound):
				h.respondError(w, http.StatusNotFound, "profile not found")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusOK, profile)
	case http.MethodPatch:
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
			Name        string `json:"name"`
			Description string `json:"description"`
			Active      *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		profile, err := h.securityService.UpdateProfile(r.Context(), usecase.UpdateProfileInput{
			ID:          profileID,
			Name:        payload.Name,
			Description: payload.Description,
			Active:      payload.Active,
		})
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "name is required")
			case errors.Is(err, usecase.ErrNotFound):
				h.respondError(w, http.StatusNotFound, "profile not found")
			case errors.Is(err, usecase.ErrProfileNameInUse):
				h.respondError(w, http.StatusConflict, "profile name already in use")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusOK, profile)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
