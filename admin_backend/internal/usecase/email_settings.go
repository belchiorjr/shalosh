package usecase

import (
	"context"
	"strings"
)

const defaultTurboSMTPAPIURL = "https://api.turbo-smtp.com/api/v2/mail/send"

type EmailSettings struct {
	ID              string `json:"id"`
	Provider        string `json:"provider"`
	APIURL          string `json:"apiUrl"`
	AuthUser        string `json:"authUser"`
	AuthPassword    string `json:"-"`
	FromEmail       string `json:"fromEmail"`
	FromName        string `json:"fromName"`
	AdminResetURL   string `json:"adminResetUrl"`
	ClientResetURL  string `json:"clientResetUrl"`
	TokenTTLMinutes int    `json:"tokenTtlMinutes"`
	Active          bool   `json:"active"`
}

func (s EmailSettings) IsUsable() bool {
	return s.Active &&
		strings.TrimSpace(s.APIURL) != "" &&
		strings.TrimSpace(s.AuthUser) != "" &&
		strings.TrimSpace(s.AuthPassword) != "" &&
		strings.TrimSpace(s.FromEmail) != ""
}

type UpdateEmailSettingsInput struct {
	APIURL          string
	AuthUser        string
	AuthPassword    string
	FromEmail       string
	FromName        string
	AdminResetURL   string
	ClientResetURL  string
	TokenTTLMinutes int
	Active          bool
}

type EmailMessage struct {
	ToEmail  string
	ToName   string
	Subject  string
	HTMLBody string
	TextBody string
}

type Mailer interface {
	Send(ctx context.Context, settings EmailSettings, message EmailMessage) error
}

type EmailSettingsRepository interface {
	Get(ctx context.Context) (EmailSettings, error)
	Update(ctx context.Context, input UpdateEmailSettingsInput) (EmailSettings, error)
}

type EmailSettingsService struct {
	repo   EmailSettingsRepository
	mailer Mailer
}

func NewEmailSettingsService(repo EmailSettingsRepository, mailer Mailer) *EmailSettingsService {
	return &EmailSettingsService{repo: repo, mailer: mailer}
}

func (s *EmailSettingsService) Get(ctx context.Context) (EmailSettings, error) {
	return s.repo.Get(ctx)
}

func (s *EmailSettingsService) Update(
	ctx context.Context,
	input UpdateEmailSettingsInput,
) (EmailSettings, error) {
	normalized := UpdateEmailSettingsInput{
		APIURL:          strings.TrimSpace(input.APIURL),
		AuthUser:        strings.TrimSpace(input.AuthUser),
		AuthPassword:    strings.TrimSpace(input.AuthPassword),
		FromEmail:       strings.ToLower(strings.TrimSpace(input.FromEmail)),
		FromName:        strings.TrimSpace(input.FromName),
		AdminResetURL:   strings.TrimSpace(input.AdminResetURL),
		ClientResetURL:  strings.TrimSpace(input.ClientResetURL),
		TokenTTLMinutes: input.TokenTTLMinutes,
		Active:          input.Active,
	}

	if normalized.APIURL == "" {
		normalized.APIURL = defaultTurboSMTPAPIURL
	}
	if normalized.TokenTTLMinutes == 0 {
		normalized.TokenTTLMinutes = 60
	}
	if normalized.TokenTTLMinutes < 5 || normalized.TokenTTLMinutes > 1440 {
		return EmailSettings{}, ErrInvalidInput
	}
	if normalized.Active {
		if normalized.AuthUser == "" ||
			normalized.FromEmail == "" ||
			normalized.AdminResetURL == "" ||
			normalized.ClientResetURL == "" {
			return EmailSettings{}, ErrInvalidInput
		}
	}

	return s.repo.Update(ctx, normalized)
}

// SendTest envia um e-mail de verificação para o destinatário informado usando
// a configuração já persistida.
func (s *EmailSettingsService) SendTest(ctx context.Context, toEmail string) error {
	recipient := strings.TrimSpace(toEmail)
	if recipient == "" {
		return ErrInvalidInput
	}

	settings, err := s.repo.Get(ctx)
	if err != nil {
		return err
	}
	if !settings.IsUsable() {
		return ErrEmailNotConfigured
	}

	return s.mailer.Send(ctx, settings, EmailMessage{
		ToEmail: recipient,
		Subject: "Teste de configuração de e-mail - Shalosh",
		TextBody: "Este é um e-mail de teste enviado pelo painel administrativo Shalosh. " +
			"Se você recebeu esta mensagem, a integração com o turboSMTP está funcionando.",
		HTMLBody: `<p>Este é um e-mail de teste enviado pelo painel administrativo Shalosh.</p>` +
			`<p>Se você recebeu esta mensagem, a integração com o turboSMTP está funcionando.</p>`,
	})
}
