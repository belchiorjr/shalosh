package security

import (
	"encoding/json"
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleProfiles(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		profiles, err := h.securityService.ListProfiles(r.Context())
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, profiles)
	case http.MethodPost:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
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

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		profile, err := h.securityService.CreateProfile(r.Context(), usecase.CreateProfileInput{
			Name:        payload.Name,
			Description: payload.Description,
			Active:      active,
		})
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "name is required")
			case errors.Is(err, usecase.ErrProfileNameInUse):
				h.respondError(w, http.StatusConflict, "profile name already in use")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusCreated, profile)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
