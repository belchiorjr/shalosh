package usecase

import (
	"context"
	"strings"
)

type AuthorizationRepository interface {
	IsUserAdministrator(ctx context.Context, userID string) (bool, error)
	HasUserPermission(ctx context.Context, userID, permissionCode string) (bool, error)
}

type AuthorizationService struct {
	repo AuthorizationRepository
}

func NewAuthorizationService(repo AuthorizationRepository) *AuthorizationService {
	return &AuthorizationService{repo: repo}
}

func (s *AuthorizationService) IsUserAdministrator(ctx context.Context, userID string) (bool, error) {
	id := strings.TrimSpace(userID)
	if id == "" {
		return false, ErrInvalidInput
	}

	return s.repo.IsUserAdministrator(ctx, id)
}

func (s *AuthorizationService) HasUserPermission(
	ctx context.Context,
	userID,
	permissionCode string,
) (bool, error) {
	id := strings.TrimSpace(userID)
	code := strings.TrimSpace(permissionCode)
	if id == "" || code == "" {
		return false, ErrInvalidInput
	}

	return s.repo.HasUserPermission(ctx, id, code)
}
