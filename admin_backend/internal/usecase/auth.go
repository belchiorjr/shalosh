package usecase

import (
	"context"
	"errors"
	"strings"
)

type AuthRepository interface {
	FindByLoginOrEmail(ctx context.Context, login string) (AuthUser, error)
	IsLoginInUseByAnotherUser(ctx context.Context, login, userID string) (bool, error)
	UpdateAccount(ctx context.Context, input UpdateAccountInput) (AuthUser, error)
}

type AuthService struct {
	repo AuthRepository
}

func NewAuthService(repo AuthRepository) *AuthService {
	return &AuthService{repo: repo}
}

type AuthUser struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Login    string `json:"login"`
	Password string `json:"-"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	Avatar   string `json:"avatar"`
	Active   bool   `json:"active"`
}

type UpdateAccountInput struct {
	UserID   string
	Name     string
	Email    string
	Login    string
	Password string
	Phone    string
	Address  string
	Avatar   string
}

func (s *AuthService) Authenticate(ctx context.Context, login, password string) (AuthUser, error) {
	normalizedLogin := strings.TrimSpace(login)
	normalizedPassword := strings.TrimSpace(password)
	if normalizedLogin == "" || normalizedPassword == "" {
		return AuthUser{}, ErrInvalidInput
	}

	user, err := s.repo.FindByLoginOrEmail(ctx, normalizedLogin)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return AuthUser{}, ErrInvalidCredentials
		}
		return AuthUser{}, err
	}

	if !user.Active || user.Password != normalizedPassword {
		return AuthUser{}, ErrInvalidCredentials
	}

	user.Password = ""
	return user, nil
}

func (s *AuthService) UpdateOwnAccount(ctx context.Context, input UpdateAccountInput) (AuthUser, error) {
	normalizedInput := UpdateAccountInput{
		UserID:   strings.TrimSpace(input.UserID),
		Name:     strings.TrimSpace(input.Name),
		Email:    strings.TrimSpace(input.Email),
		Login:    strings.ToLower(strings.TrimSpace(input.Login)),
		Password: strings.TrimSpace(input.Password),
		Phone:    strings.TrimSpace(input.Phone),
		Address:  strings.TrimSpace(input.Address),
		Avatar:   strings.TrimSpace(input.Avatar),
	}

	if normalizedInput.UserID == "" ||
		normalizedInput.Name == "" ||
		normalizedInput.Email == "" ||
		normalizedInput.Login == "" {
		return AuthUser{}, ErrInvalidInput
	}

	loginInUse, err := s.repo.IsLoginInUseByAnotherUser(
		ctx,
		normalizedInput.Login,
		normalizedInput.UserID,
	)
	if err != nil {
		return AuthUser{}, err
	}
	if loginInUse {
		return AuthUser{}, ErrLoginInUse
	}

	user, err := s.repo.UpdateAccount(ctx, normalizedInput)
	if err != nil {
		return AuthUser{}, err
	}
	user.Password = ""

	return user, nil
}
