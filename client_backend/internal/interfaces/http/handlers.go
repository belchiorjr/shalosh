package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"client_backend/internal/usecase"
)

type ClientHandler struct {
	service *usecase.ClientService
}

func NewClientHandler(service *usecase.ClientService) *ClientHandler {
	return &ClientHandler{service: service}
}

func (h *ClientHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", h.handleHealth)
	mux.HandleFunc("/clients", h.handleClients)
	mux.HandleFunc("/clients/", h.handleClientByID)
}

func (h *ClientHandler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *ClientHandler) handleClients(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		clients, err := h.service.List(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		respondJSON(w, http.StatusOK, clients)
	case http.MethodPost:
		var payload struct {
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		client, err := h.service.Register(r.Context(), usecase.RegisterClientInput{
			Name:  payload.Name,
			Email: payload.Email,
		})
		if err != nil {
			h.handleUsecaseError(w, err)
			return
		}

		respondJSON(w, http.StatusCreated, client)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *ClientHandler) handleClientByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/clients/")
	if id == "" || strings.Contains(id, "/") {
		respondError(w, http.StatusNotFound, "client not found")
		return
	}

	client, err := h.service.Get(r.Context(), id)
	if err != nil {
		h.handleUsecaseError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, client)
}

func (h *ClientHandler) handleUsecaseError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		respondError(w, http.StatusBadRequest, "invalid input")
	case errors.Is(err, usecase.ErrNotFound):
		respondError(w, http.StatusNotFound, "client not found")
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
