package clients

import (
	"encoding/json"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleClientByID(w http.ResponseWriter, r *http.Request) {
	trimmedPath := strings.TrimPrefix(r.URL.Path, "/clients/")
	if trimmedPath == "" || strings.Contains(trimmedPath, "/") {
		h.respondError(w, http.StatusNotFound, "client not found")
		return
	}

	clientID := strings.TrimSpace(trimmedPath)
	if clientID == "" {
		h.respondError(w, http.StatusNotFound, "client not found")
		return
	}

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

		client, err := h.clientService.GetDetail(r.Context(), clientID)
		if err != nil {
			h.handleClientUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusOK, client)
	case http.MethodPatch:
		allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientsUpdate)
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !allowed {
			h.respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		var payload struct {
			Name      string            `json:"name"`
			Email     string            `json:"email"`
			Login     string            `json:"login"`
			Password  string            `json:"password"`
			Avatar    string            `json:"avatar"`
			Active    *bool             `json:"active"`
			Addresses *[]addressPayload `json:"addresses"`
			Phones    *[]phonePayload   `json:"phones"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
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

		if name == "" || email == "" || login == "" {
			h.respondError(w, http.StatusBadRequest, "name, email and login are required")
			return
		}

		if password != "" {
			canUpdatePassword, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientsPasswordUpdate)
			if err != nil {
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
				return
			}
			if !canUpdatePassword {
				h.respondError(w, http.StatusForbidden, "forbidden")
				return
			}
		}

		if payload.Addresses != nil {
			canUpdateAddresses, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientAddressesUpdate)
			if err != nil {
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
				return
			}
			if !canUpdateAddresses {
				h.respondError(w, http.StatusForbidden, "forbidden")
				return
			}
		}

		if payload.Phones != nil {
			canUpdatePhones, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientPhonesUpdate)
			if err != nil {
				h.respondError(w, http.StatusInternalServerError, "unexpected error")
				return
			}
			if !canUpdatePhones {
				h.respondError(w, http.StatusForbidden, "forbidden")
				return
			}
		}

		var addresses *[]usecase.ClientAddressInput
		if payload.Addresses != nil {
			mapped := mapAddressPayloads(*payload.Addresses)
			addresses = &mapped
		}

		var phones *[]usecase.ClientPhoneInput
		if payload.Phones != nil {
			mapped := mapPhonePayloads(*payload.Phones)
			phones = &mapped
		}

		client, err := h.clientService.Update(r.Context(), usecase.UpdateClientInput{
			ID:        clientID,
			Name:      name,
			Email:     email,
			Login:     login,
			Password:  password,
			Avatar:    avatar,
			Active:    payload.Active,
			Addresses: addresses,
			Phones:    phones,
		})
		if err != nil {
			h.handleClientUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusOK, client)
	case http.MethodDelete:
		allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientsDelete)
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !allowed {
			h.respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		client, err := h.clientService.Deactivate(r.Context(), clientID)
		if err != nil {
			h.handleClientUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusOK, client)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
