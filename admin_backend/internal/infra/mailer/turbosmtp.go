package mailer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"admin_backend/internal/usecase"
)

// TurboSMTPClient envia mensagens pela API REST v2 do turboSMTP.
type TurboSMTPClient struct {
	httpClient *http.Client
}

func NewTurboSMTPClient(timeout time.Duration) *TurboSMTPClient {
	if timeout <= 0 {
		timeout = 15 * time.Second
	}

	return &TurboSMTPClient{httpClient: &http.Client{Timeout: timeout}}
}

type turboSMTPRequest struct {
	AuthUser    string `json:"authuser"`
	AuthPass    string `json:"authpass"`
	From        string `json:"from"`
	To          string `json:"to"`
	Subject     string `json:"subject"`
	Content     string `json:"content,omitempty"`
	HTMLContent string `json:"html_content,omitempty"`
}

func (c *TurboSMTPClient) Send(
	ctx context.Context,
	settings usecase.EmailSettings,
	message usecase.EmailMessage,
) error {
	if !settings.IsUsable() {
		return usecase.ErrEmailNotConfigured
	}
	if strings.TrimSpace(message.ToEmail) == "" {
		return usecase.ErrInvalidInput
	}

	payload := turboSMTPRequest{
		AuthUser:    settings.AuthUser,
		AuthPass:    settings.AuthPassword,
		From:        formatAddress(settings.FromName, settings.FromEmail),
		To:          formatAddress(message.ToName, message.ToEmail),
		Subject:     message.Subject,
		Content:     message.TextBody,
		HTMLContent: message.HTMLBody,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		settings.APIURL,
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")

	response, err := c.httpClient.Do(request)
	if err != nil {
		return fmt.Errorf("%w: %s", usecase.ErrEmailSendFailed, err)
	}
	defer response.Body.Close()

	responseBody, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf(
			"%w: turbosmtp respondeu %d: %s",
			usecase.ErrEmailSendFailed,
			response.StatusCode,
			strings.TrimSpace(string(responseBody)),
		)
	}

	return nil
}

func formatAddress(name, email string) string {
	trimmedName := strings.TrimSpace(name)
	trimmedEmail := strings.TrimSpace(email)
	if trimmedName == "" {
		return trimmedEmail
	}

	return fmt.Sprintf("%s <%s>", trimmedName, trimmedEmail)
}
