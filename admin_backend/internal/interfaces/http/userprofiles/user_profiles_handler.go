package userprofiles

import (
	"encoding/json"
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleUserProfiles(w http.ResponseWriter, r *http.Request, userID string) {
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

	switch r.Method {
	case http.MethodGet:
		profileIDs, err := h.userProfileService.GetProfileIDsByUserID(r.Context(), userID)
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrNotFound):
				h.respondError(w, http.StatusNotFound, "user not found")
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "invalid input")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"userId":     userID,
			"profileIds": profileIDs,
		})
	case http.MethodPut:
		var payload struct {
			ProfileIDs []string `json:"profileIds"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		normalizedProfileIDs, err := h.userProfileService.SaveProfileIDsByUserID(
			r.Context(),
			userID,
			payload.ProfileIDs,
		)
		if err != nil {
			switch {
			case errors.Is(err, usecase.ErrNotFound):
				h.respondError(w, http.StatusNotFound, "user not found")
			case errors.Is(err, usecase.ErrProfilesNotFound):
				h.respondError(w, http.StatusBadRequest, "one or more profiles do not exist")
			case errors.Is(err, usecase.ErrInvalidInput):
				h.respondError(w, http.StatusBadRequest, "invalid input")
			default:
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
			}
			return
		}

		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"userId":     userID,
			"profileIds": normalizedProfileIDs,
		})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
