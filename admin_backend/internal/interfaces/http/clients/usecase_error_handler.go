package clients

import (
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleClientUsecaseError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		h.respondError(w, http.StatusBadRequest, "invalid input")
	case errors.Is(err, usecase.ErrNotFound):
		h.respondError(w, http.StatusNotFound, "client not found")
	case errors.Is(err, usecase.ErrClientLoginInUse):
		h.respondError(w, http.StatusConflict, "client login already in use")
	case errors.Is(err, usecase.ErrClientEmailInUse):
		h.respondError(w, http.StatusConflict, "client email already in use")
	default:
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}
