package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

type UserHandler struct {
	service *usecase.UserService
}

func NewUserHandler(service *usecase.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", h.handleHealth)
	mux.HandleFunc("/users", h.handleUsers)
	mux.HandleFunc("/users/", h.handleUserByID)
}

func (h *UserHandler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *UserHandler) handleUsers(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		users, err := h.service.List(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		respondJSON(w, http.StatusOK, users)
	case http.MethodPost:
		var payload struct {
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		user, err := h.service.Register(r.Context(), usecase.RegisterUserInput{
			Name:  payload.Name,
			Email: payload.Email,
		})
		if err != nil {
			h.handleUsecaseError(w, err)
			return
		}

		respondJSON(w, http.StatusCreated, user)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handleUserByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/users/")
	if id == "" || strings.Contains(id, "/") {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	user, err := h.service.Get(r.Context(), id)
	if err != nil {
		h.handleUsecaseError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) handleUsecaseError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		respondError(w, http.StatusBadRequest, "invalid input")
	case errors.Is(err, usecase.ErrNotFound):
		respondError(w, http.StatusNotFound, "user not found")
	default:
		respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
