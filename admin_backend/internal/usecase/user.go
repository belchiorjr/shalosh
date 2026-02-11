package usecase

import (
	"context"
	"strings"
	"time"

	"admin_backend/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user domain.User) error
	GetByID(ctx context.Context, id string) (domain.User, error)
	List(ctx context.Context) ([]domain.User, error)
}

type IDGenerator interface {
	NewID() string
}

type Clock interface {
	Now() time.Time
}

// UserService implements user-related use cases.
type UserService struct {
	repo  UserRepository
	ids   IDGenerator
	clock Clock
}

func NewUserService(repo UserRepository, ids IDGenerator, clock Clock) *UserService {
	return &UserService{
		repo:  repo,
		ids:   ids,
		clock: clock,
	}
}

type RegisterUserInput struct {
	Name  string
	Email string
}

func (s *UserService) Register(ctx context.Context, input RegisterUserInput) (domain.User, error) {
	name := strings.TrimSpace(input.Name)
	email := strings.TrimSpace(input.Email)
	if name == "" || email == "" {
		return domain.User{}, ErrInvalidInput
	}

	user := domain.User{
		ID:        s.ids.NewID(),
		Name:      name,
		Email:     email,
		CreatedAt: s.clock.Now(),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return domain.User{}, err
	}

	return user, nil
}

func (s *UserService) Get(ctx context.Context, id string) (domain.User, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return domain.User{}, ErrInvalidInput
	}

	return s.repo.GetByID(ctx, id)
}

func (s *UserService) List(ctx context.Context) ([]domain.User, error) {
	return s.repo.List(ctx)
}
