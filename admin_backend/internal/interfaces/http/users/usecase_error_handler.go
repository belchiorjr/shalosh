package users

import (
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleUsecaseError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		h.respondError(w, http.StatusBadRequest, "invalid input")
	case errors.Is(err, usecase.ErrNotFound):
		h.respondError(w, http.StatusNotFound, "user not found")
	default:
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}
