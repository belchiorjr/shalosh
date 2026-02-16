package clients

import (
	"errors"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleCEPByZipCode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientsRead)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}
	if !allowed {
		h.respondError(w, http.StatusForbidden, "forbidden")
		return
	}

	trimmedPath := strings.TrimPrefix(r.URL.Path, "/utils/cep/")
	response, err := h.clientService.LookupZipCode(r.Context(), trimmedPath)
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidInput):
			h.respondError(w, http.StatusBadRequest, "invalid zipcode")
		case errors.Is(err, usecase.ErrZipCodeNotFound):
			h.respondError(w, http.StatusNotFound, "zipcode not found")
		case errors.Is(err, usecase.ErrZipCodeUnavailable):
			h.respondError(w, http.StatusBadGateway, "zipcode service unavailable")
		default:
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
		}
		return
	}

	h.respondJSON(w, http.StatusOK, response)
}
