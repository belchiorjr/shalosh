package projects

import (
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectUsecaseError(
	w http.ResponseWriter,
	err error,
	defaultInvalidInputMessage string,
) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		message := defaultInvalidInputMessage
		if message == "" {
			message = "invalid input"
		}
		h.respondError(w, http.StatusBadRequest, message)
	case errors.Is(err, usecase.ErrNotFound):
		h.respondError(w, http.StatusNotFound, "project not found")
	case errors.Is(err, usecase.ErrProjectNameInUse):
		h.respondError(w, http.StatusConflict, "project name already in use")
	case errors.Is(err, usecase.ErrProjectTypeCodeInUse):
		h.respondError(w, http.StatusConflict, "project type code already in use")
	case errors.Is(err, usecase.ErrProjectTypeNameInUse):
		h.respondError(w, http.StatusConflict, "project type name already in use")
	case errors.Is(err, usecase.ErrProjectTypeNotFound):
		h.respondError(w, http.StatusBadRequest, "project type not found")
	case errors.Is(err, usecase.ErrProjectCategoryNotFound):
		h.respondError(w, http.StatusBadRequest, "project category not found")
	case errors.Is(err, usecase.ErrProjectClientsNotFound):
		h.respondError(w, http.StatusBadRequest, "one or more clients do not exist")
	default:
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}
