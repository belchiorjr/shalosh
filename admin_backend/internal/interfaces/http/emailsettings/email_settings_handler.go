package emailsettings

import (
	"encoding/json"
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleEmailSettings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorize(w, r, permissionEmailSettingsRead); !ok {
			return
		}

		settings, err := h.emailSettingsService.Get(r.Context())
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, mapSettingsResponse(settings))
	case http.MethodPut:
		if _, ok := h.authorize(w, r, permissionEmailSettingsUpdate); !ok {
			return
		}

		var payload struct {
			APIURL          string `json:"apiUrl"`
			AuthUser        string `json:"authUser"`
			AuthPassword    string `json:"authPassword"`
			FromEmail       string `json:"fromEmail"`
			FromName        string `json:"fromName"`
			AdminResetURL   string `json:"adminResetUrl"`
			ClientResetURL  string `json:"clientResetUrl"`
			TokenTTLMinutes int    `json:"tokenTtlMinutes"`
			Active          bool   `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		settings, err := h.emailSettingsService.Update(r.Context(), usecase.UpdateEmailSettingsInput{
			APIURL:          payload.APIURL,
			AuthUser:        payload.AuthUser,
			AuthPassword:    payload.AuthPassword,
			FromEmail:       payload.FromEmail,
			FromName:        payload.FromName,
			AdminResetURL:   payload.AdminResetURL,
			ClientResetURL:  payload.ClientResetURL,
			TokenTTLMinutes: payload.TokenTTLMinutes,
			Active:          payload.Active,
		})
		if err != nil {
			if errors.Is(err, usecase.ErrInvalidInput) {
				h.respondError(
					w,
					http.StatusBadRequest,
					"usuário, remetente, URLs de redefinição e expiração entre 5 e 1440 minutos são obrigatórios",
				)
				return
			}
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, mapSettingsResponse(settings))
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *Handler) HandleEmailSettingsTest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if _, ok := h.authorize(w, r, permissionEmailSettingsUpdate); !ok {
		return
	}

	var payload struct {
		ToEmail string `json:"toEmail"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	if err := h.emailSettingsService.SendTest(r.Context(), payload.ToEmail); err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidInput):
			h.respondError(w, http.StatusBadRequest, "informe o e-mail de destino")
		case errors.Is(err, usecase.ErrEmailNotConfigured):
			h.respondError(w, http.StatusPreconditionFailed, "configuração de e-mail incompleta ou inativa")
		case errors.Is(err, usecase.ErrEmailSendFailed):
			h.respondError(w, http.StatusBadGateway, err.Error())
		default:
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
		}
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}

// mapSettingsResponse nunca devolve a senha da API; expõe apenas se já existe uma.
func mapSettingsResponse(settings usecase.EmailSettings) map[string]interface{} {
	return map[string]interface{}{
		"id":              settings.ID,
		"provider":        settings.Provider,
		"apiUrl":          settings.APIURL,
		"authUser":        settings.AuthUser,
		"hasAuthPassword": settings.AuthPassword != "",
		"fromEmail":       settings.FromEmail,
		"fromName":        settings.FromName,
		"adminResetUrl":   settings.AdminResetURL,
		"clientResetUrl":  settings.ClientResetURL,
		"tokenTtlMinutes": settings.TokenTTLMinutes,
		"active":          settings.Active,
		"configurationOk": settings.IsUsable(),
	}
}
