package usecase

import (
	"context"
	"strings"
	"time"

	"client_backend/internal/domain"
)

type ClientRepository interface {
	Create(ctx context.Context, client domain.Client) error
	GetByID(ctx context.Context, id string) (domain.Client, error)
	List(ctx context.Context) ([]domain.Client, error)
}

type IDGenerator interface {
	NewID() string
}

type Clock interface {
	Now() time.Time
}

// ClientService implements client-related use cases.
type ClientService struct {
	repo  ClientRepository
	ids   IDGenerator
	clock Clock
}

func NewClientService(repo ClientRepository, ids IDGenerator, clock Clock) *ClientService {
	return &ClientService{
		repo:  repo,
		ids:   ids,
		clock: clock,
	}
}

type RegisterClientInput struct {
	Name  string
	Email string
}

func (s *ClientService) Register(ctx context.Context, input RegisterClientInput) (domain.Client, error) {
	name := strings.TrimSpace(input.Name)
	email := strings.TrimSpace(input.Email)
	if name == "" || email == "" {
		return domain.Client{}, ErrInvalidInput
	}

	client := domain.Client{
		ID:        s.ids.NewID(),
		Name:      name,
		Email:     email,
		CreatedAt: s.clock.Now(),
	}

	if err := s.repo.Create(ctx, client); err != nil {
		return domain.Client{}, err
	}

	return client, nil
}

func (s *ClientService) Get(ctx context.Context, id string) (domain.Client, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return domain.Client{}, ErrInvalidInput
	}

	return s.repo.GetByID(ctx, id)
}

func (s *ClientService) List(ctx context.Context) ([]domain.Client, error) {
	return s.repo.List(ctx)
}
