package passwordreset

import (
	"encoding/json"
	"errors"
	"net/http"

	"admin_backend/internal/usecase"
)

type Handler struct {
	passwordResetService *usecase.PasswordResetService
	respondJSON          func(w http.ResponseWriter, status int, payload interface{})
	respondError         func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	passwordResetService *usecase.PasswordResetService,
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		passwordResetService: passwordResetService,
		respondJSON:          respondJSON,
		respondError:         respondError,
	}
}

func (h *Handler) HandleAdminForgotPassword(w http.ResponseWriter, r *http.Request) {
	h.handleForgotPassword(w, r, usecase.PasswordResetAudienceAdmin)
}

func (h *Handler) HandleClientForgotPassword(w http.ResponseWriter, r *http.Request) {
	h.handleForgotPassword(w, r, usecase.PasswordResetAudienceClient)
}

func (h *Handler) HandleAdminResetPassword(w http.ResponseWriter, r *http.Request) {
	h.handleResetPassword(w, r)
}

func (h *Handler) HandleClientResetPassword(w http.ResponseWriter, r *http.Request) {
	h.handleResetPassword(w, r)
}

// handleForgotPassword responde 202 mesmo quando a conta não existe, para não
// revelar quais logins/e-mails estão cadastrados.
func (h *Handler) handleForgotPassword(
	w http.ResponseWriter,
	r *http.Request,
	audience string,
) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Login string `json:"login"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	if err := h.passwordResetService.RequestReset(r.Context(), audience, payload.Login); err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidInput):
			h.respondError(w, http.StatusBadRequest, "informe seu login ou e-mail")
		case errors.Is(err, usecase.ErrEmailNotConfigured):
			h.respondError(w, http.StatusPreconditionFailed, "envio de e-mail não configurado")
		case errors.Is(err, usecase.ErrEmailSendFailed):
			h.respondError(w, http.StatusBadGateway, "não foi possível enviar o e-mail de recuperação")
		default:
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
		}
		return
	}

	h.respondJSON(w, http.StatusAccepted, map[string]string{
		"status": "accepted",
		"message": "Se a conta existir, enviaremos um e-mail com as instruções de " +
			"recuperação de senha.",
	})
}

func (h *Handler) handleResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	if err := h.passwordResetService.ConfirmReset(r.Context(), payload.Token, payload.Password); err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidInput):
			h.respondError(w, http.StatusBadRequest, "token e senha com no mínimo 6 caracteres são obrigatórios")
		case errors.Is(err, usecase.ErrResetTokenInvalid):
			h.respondError(w, http.StatusBadRequest, "link de recuperação inválido ou já utilizado")
		case errors.Is(err, usecase.ErrResetTokenExpired):
			h.respondError(w, http.StatusBadRequest, "link de recuperação expirado")
		default:
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
		}
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}
