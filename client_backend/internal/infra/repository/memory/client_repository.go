package memory

import (
	"context"
	"sync"

	"client_backend/internal/domain"
	"client_backend/internal/usecase"
)

type ClientRepository struct {
	mu      sync.RWMutex
	clients map[string]domain.Client
}

func NewClientRepository() *ClientRepository {
	return &ClientRepository{
		clients: make(map[string]domain.Client),
	}
}

func (r *ClientRepository) Create(_ context.Context, client domain.Client) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.clients[client.ID] = client
	return nil
}

func (r *ClientRepository) GetByID(_ context.Context, id string) (domain.Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	client, ok := r.clients[id]
	if !ok {
		return domain.Client{}, usecase.ErrNotFound
	}

	return client, nil
}

func (r *ClientRepository) List(_ context.Context) ([]domain.Client, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	clients := make([]domain.Client, 0, len(r.clients))
	for _, client := range r.clients {
		clients = append(clients, client)
	}

	return clients, nil
}
