package clients

import (
	"encoding/json"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleClients(w http.ResponseWriter, r *http.Request) {
	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	switch r.Method {
	case http.MethodGet:
		allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientsRead)
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !allowed {
			h.respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		clients, err := h.clientService.List(r.Context(), false)
		if err != nil {
			h.handleClientUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusOK, clients)
	case http.MethodPost:
		allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientsCreate)
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !allowed {
			h.respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		var payload struct {
			Name      string           `json:"name"`
			Email     string           `json:"email"`
			Login     string           `json:"login"`
			Password  string           `json:"password"`
			Avatar    string           `json:"avatar"`
			Active    *bool            `json:"active"`
			Addresses []addressPayload `json:"addresses"`
			Phones    []phonePayload   `json:"phones"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		if len(payload.Addresses) > 0 {
			allowedAddressCreate, err := h.hasUserPermission(
				r.Context(),
				claims.Sub,
				permissionClientAddressesCreate,
			)
			if err != nil {
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
				return
			}
			if !allowedAddressCreate {
				h.respondError(w, http.StatusForbidden, "forbidden")
				return
			}
		}

		if len(payload.Phones) > 0 {
			allowedPhoneCreate, err := h.hasUserPermission(
				r.Context(),
				claims.Sub,
				permissionClientPhonesCreate,
			)
			if err != nil {
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
				return
			}
			if !allowedPhoneCreate {
				h.respondError(w, http.StatusForbidden, "forbidden")
				return
			}
		}

		name := strings.TrimSpace(payload.Name)
		email := strings.TrimSpace(payload.Email)
		login := strings.ToLower(strings.TrimSpace(payload.Login))
		password := strings.TrimSpace(payload.Password)
		avatar, err := h.normalizeAvatarInput(payload.Avatar)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		if name == "" || email == "" || login == "" || password == "" {
			h.respondError(w, http.StatusBadRequest, "name, email, login and password are required")
			return
		}

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		client, err := h.clientService.Create(r.Context(), usecase.CreateClientInput{
			Name:      name,
			Email:     email,
			Login:     login,
			Password:  password,
			Avatar:    avatar,
			Active:    active,
			Addresses: mapAddressPayloads(payload.Addresses),
			Phones:    mapPhonePayloads(payload.Phones),
		})
		if err != nil {
			h.handleClientUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusCreated, client)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
