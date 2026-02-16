package usecase

import (
	"context"
	"strings"
)

type UserProfileRepository interface {
	ListProfilesByUserID(ctx context.Context, userID string) ([]UserProfile, error)
	UserExists(ctx context.Context, userID string) (bool, error)
	ListProfileIDsByUserID(ctx context.Context, userID string) ([]string, error)
	ReplaceUserProfileIDs(ctx context.Context, userID string, profileIDs []string) error
}

type UserProfileService struct {
	repo UserProfileRepository
}

func NewUserProfileService(repo UserProfileRepository) *UserProfileService {
	return &UserProfileService{repo: repo}
}

type UserProfile struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Active      bool   `json:"active"`
}

func (s *UserProfileService) ListProfilesByUserID(ctx context.Context, userID string) ([]UserProfile, error) {
	id := strings.TrimSpace(userID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListProfilesByUserID(ctx, id)
}

func (s *UserProfileService) GetProfileIDsByUserID(ctx context.Context, userID string) ([]string, error) {
	id := strings.TrimSpace(userID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	userExists, err := s.repo.UserExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if !userExists {
		return nil, ErrNotFound
	}

	return s.repo.ListProfileIDsByUserID(ctx, id)
}

func (s *UserProfileService) SaveProfileIDsByUserID(
	ctx context.Context,
	userID string,
	profileIDs []string,
) ([]string, error) {
	id := strings.TrimSpace(userID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	normalizedProfileIDs := uniqueTrimmedIDs(profileIDs)

	if err := s.repo.ReplaceUserProfileIDs(ctx, id, normalizedProfileIDs); err != nil {
		return nil, err
	}

	return normalizedProfileIDs, nil
}
