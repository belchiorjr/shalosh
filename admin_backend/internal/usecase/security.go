package usecase

import (
	"context"
	"strings"
	"time"
)

type SecurityRepository interface {
	ListPermissions(ctx context.Context) ([]Permission, error)
	CreatePermission(ctx context.Context, input CreatePermissionInput) (Permission, error)
	GetPermissionByID(ctx context.Context, id string) (Permission, error)
	UpdatePermission(ctx context.Context, input UpdatePermissionInput) (Permission, error)

	ListProfiles(ctx context.Context) ([]Profile, error)
	CreateProfile(ctx context.Context, input CreateProfileInput) (Profile, error)
	GetProfileByID(ctx context.Context, id string) (Profile, error)
	UpdateProfile(ctx context.Context, input UpdateProfileInput) (Profile, error)

	ListProfilePermissionIDs(ctx context.Context, profileID string) ([]string, error)
	ReplaceProfilePermissionIDs(ctx context.Context, profileID string, permissionIDs []string) error
}

type SecurityService struct {
	repo SecurityRepository
}

func NewSecurityService(repo SecurityRepository) *SecurityService {
	return &SecurityService{repo: repo}
}

type Permission struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Active      bool      `json:"active"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
}

type Profile struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	Active          bool      `json:"active"`
	Created         time.Time `json:"created"`
	Updated         time.Time `json:"updated"`
	PermissionCount int       `json:"permissionCount"`
}

type CreatePermissionInput struct {
	Code        string
	Name        string
	Description string
	Active      bool
}

type UpdatePermissionInput struct {
	ID          string
	Code        string
	Name        string
	Description string
	Active      *bool
}

type CreateProfileInput struct {
	Name        string
	Description string
	Active      bool
}

type UpdateProfileInput struct {
	ID          string
	Name        string
	Description string
	Active      *bool
}

func (s *SecurityService) ListPermissions(ctx context.Context) ([]Permission, error) {
	return s.repo.ListPermissions(ctx)
}

func (s *SecurityService) CreatePermission(ctx context.Context, input CreatePermissionInput) (Permission, error) {
	normalizedInput := CreatePermissionInput{
		Code:        strings.ToLower(strings.TrimSpace(input.Code)),
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Active:      input.Active,
	}
	if normalizedInput.Code == "" || normalizedInput.Name == "" {
		return Permission{}, ErrInvalidInput
	}

	return s.repo.CreatePermission(ctx, normalizedInput)
}

func (s *SecurityService) GetPermissionByID(ctx context.Context, id string) (Permission, error) {
	permissionID := strings.TrimSpace(id)
	if permissionID == "" {
		return Permission{}, ErrInvalidInput
	}

	return s.repo.GetPermissionByID(ctx, permissionID)
}

func (s *SecurityService) UpdatePermission(ctx context.Context, input UpdatePermissionInput) (Permission, error) {
	normalizedInput := UpdatePermissionInput{
		ID:          strings.TrimSpace(input.ID),
		Code:        strings.ToLower(strings.TrimSpace(input.Code)),
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Active:      input.Active,
	}
	if normalizedInput.ID == "" || normalizedInput.Code == "" || normalizedInput.Name == "" {
		return Permission{}, ErrInvalidInput
	}

	return s.repo.UpdatePermission(ctx, normalizedInput)
}

func (s *SecurityService) ListProfiles(ctx context.Context) ([]Profile, error) {
	return s.repo.ListProfiles(ctx)
}

func (s *SecurityService) CreateProfile(ctx context.Context, input CreateProfileInput) (Profile, error) {
	normalizedInput := CreateProfileInput{
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Active:      input.Active,
	}
	if normalizedInput.Name == "" {
		return Profile{}, ErrInvalidInput
	}

	return s.repo.CreateProfile(ctx, normalizedInput)
}

func (s *SecurityService) GetProfileByID(ctx context.Context, id string) (Profile, error) {
	profileID := strings.TrimSpace(id)
	if profileID == "" {
		return Profile{}, ErrInvalidInput
	}

	return s.repo.GetProfileByID(ctx, profileID)
}

func (s *SecurityService) UpdateProfile(ctx context.Context, input UpdateProfileInput) (Profile, error) {
	normalizedInput := UpdateProfileInput{
		ID:          strings.TrimSpace(input.ID),
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Active:      input.Active,
	}
	if normalizedInput.ID == "" || normalizedInput.Name == "" {
		return Profile{}, ErrInvalidInput
	}

	return s.repo.UpdateProfile(ctx, normalizedInput)
}

func (s *SecurityService) ListProfilePermissionIDs(
	ctx context.Context,
	profileID string,
) ([]string, error) {
	id := strings.TrimSpace(profileID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListProfilePermissionIDs(ctx, id)
}

func (s *SecurityService) SaveProfilePermissionIDs(
	ctx context.Context,
	profileID string,
	permissionIDs []string,
) ([]string, error) {
	id := strings.TrimSpace(profileID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	normalizedPermissionIDs := uniqueTrimmedIDs(permissionIDs)

	if err := s.repo.ReplaceProfilePermissionIDs(ctx, id, normalizedPermissionIDs); err != nil {
		return nil, err
	}

	return normalizedPermissionIDs, nil
}
