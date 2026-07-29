package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"
)

const (
	PasswordResetAudienceAdmin  = "admin"
	PasswordResetAudienceClient = "client"
)

type PasswordResetAccount struct {
	ID     string
	Name   string
	Email  string
	Active bool
}

type PasswordResetToken struct {
	ID        string
	Audience  string
	SubjectID string
	Email     string
	ExpiresAt time.Time
}

type CreatePasswordResetTokenInput struct {
	Audience  string
	SubjectID string
	Email     string
	TokenHash string
	ExpiresAt time.Time
}

type PasswordResetRepository interface {
	FindAccountByLoginOrEmail(ctx context.Context, audience, login string) (PasswordResetAccount, error)
	InvalidateActiveTokens(ctx context.Context, audience, subjectID string) error
	CreateToken(ctx context.Context, input CreatePasswordResetTokenInput) (PasswordResetToken, error)
	FindTokenByHash(ctx context.Context, tokenHash string) (PasswordResetToken, time.Time, error)
	ConsumeTokenAndUpdatePassword(ctx context.Context, tokenID, audience, subjectID, password string) error
}

type PasswordResetService struct {
	repo         PasswordResetRepository
	settingsRepo EmailSettingsRepository
	mailer       Mailer
	now          func() time.Time
}

func NewPasswordResetService(
	repo PasswordResetRepository,
	settingsRepo EmailSettingsRepository,
	mailer Mailer,
) *PasswordResetService {
	return &PasswordResetService{
		repo:         repo,
		settingsRepo: settingsRepo,
		mailer:       mailer,
		now:          time.Now,
	}
}

// RequestReset gera um token de uso único e envia o link de redefinição por e-mail.
// Contas inexistentes ou inativas são silenciosamente ignoradas para não permitir
// enumeração de usuários — o handler sempre responde sucesso.
func (s *PasswordResetService) RequestReset(ctx context.Context, audience, login string) error {
	normalizedAudience, err := normalizeAudience(audience)
	if err != nil {
		return err
	}

	normalizedLogin := strings.TrimSpace(login)
	if normalizedLogin == "" {
		return ErrInvalidInput
	}

	settings, err := s.settingsRepo.Get(ctx)
	if err != nil {
		return err
	}
	if !settings.IsUsable() {
		return ErrEmailNotConfigured
	}

	account, err := s.repo.FindAccountByLoginOrEmail(ctx, normalizedAudience, normalizedLogin)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil
		}
		return err
	}
	if !account.Active || strings.TrimSpace(account.Email) == "" {
		return nil
	}

	if err := s.repo.InvalidateActiveTokens(ctx, normalizedAudience, account.ID); err != nil {
		return err
	}

	rawToken, err := generateResetToken()
	if err != nil {
		return err
	}

	expiresAt := s.now().UTC().Add(time.Duration(settings.TokenTTLMinutes) * time.Minute)
	if _, err := s.repo.CreateToken(ctx, CreatePasswordResetTokenInput{
		Audience:  normalizedAudience,
		SubjectID: account.ID,
		Email:     account.Email,
		TokenHash: hashResetToken(rawToken),
		ExpiresAt: expiresAt,
	}); err != nil {
		return err
	}

	baseURL := settings.AdminResetURL
	if normalizedAudience == PasswordResetAudienceClient {
		baseURL = settings.ClientResetURL
	}

	return s.mailer.Send(ctx, settings, buildResetMessage(
		account,
		buildResetLink(baseURL, rawToken),
		settings.TokenTTLMinutes,
	))
}

// ConfirmReset valida o token e grava a nova senha em uma única transação.
func (s *PasswordResetService) ConfirmReset(ctx context.Context, token, newPassword string) error {
	normalizedToken := strings.TrimSpace(token)
	normalizedPassword := strings.TrimSpace(newPassword)
	if normalizedToken == "" || len(normalizedPassword) < 6 {
		return ErrInvalidInput
	}

	resetToken, usedAt, err := s.repo.FindTokenByHash(ctx, hashResetToken(normalizedToken))
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return ErrResetTokenInvalid
		}
		return err
	}
	if !usedAt.IsZero() {
		return ErrResetTokenInvalid
	}
	if s.now().UTC().After(resetToken.ExpiresAt) {
		return ErrResetTokenExpired
	}

	return s.repo.ConsumeTokenAndUpdatePassword(
		ctx,
		resetToken.ID,
		resetToken.Audience,
		resetToken.SubjectID,
		normalizedPassword,
	)
}

func normalizeAudience(audience string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(audience)) {
	case PasswordResetAudienceAdmin:
		return PasswordResetAudienceAdmin, nil
	case PasswordResetAudienceClient:
		return PasswordResetAudienceClient, nil
	default:
		return "", ErrInvalidInput
	}
}

func generateResetToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return hex.EncodeToString(buffer), nil
}

func hashResetToken(token string) string {
	sum := sha256.Sum256([]byte(token))

	return hex.EncodeToString(sum[:])
}

func buildResetLink(baseURL, token string) string {
	trimmedBase := strings.TrimSpace(baseURL)
	separator := "?"
	if strings.Contains(trimmedBase, "?") {
		separator = "&"
	}

	return fmt.Sprintf("%s%stoken=%s", trimmedBase, separator, url.QueryEscape(token))
}

func buildResetMessage(
	account PasswordResetAccount,
	resetLink string,
	ttlMinutes int,
) EmailMessage {
	greetingName := strings.TrimSpace(account.Name)
	if greetingName == "" {
		greetingName = account.Email
	}

	return EmailMessage{
		ToEmail: account.Email,
		ToName:  greetingName,
		Subject: "Recuperação de senha - Shalosh",
		TextBody: fmt.Sprintf(
			"Olá, %s.\n\nRecebemos um pedido para redefinir sua senha. "+
				"Acesse o link abaixo para cadastrar uma nova senha:\n\n%s\n\n"+
				"O link expira em %d minutos. Se você não solicitou, ignore este e-mail.",
			greetingName,
			resetLink,
			ttlMinutes,
		),
		HTMLBody: fmt.Sprintf(
			`<p>Olá, %s.</p>`+
				`<p>Recebemos um pedido para redefinir sua senha. `+
				`Clique no botão abaixo para cadastrar uma nova senha:</p>`+
				`<p><a href="%s">Redefinir senha</a></p>`+
				`<p>Ou copie e cole este endereço no navegador:<br>%s</p>`+
				`<p>O link expira em %d minutos. Se você não solicitou, ignore este e-mail.</p>`,
			greetingName,
			resetLink,
			resetLink,
			ttlMinutes,
		),
	}
}
