package memory

import (
	"context"
	"sync"

	"admin_backend/internal/domain"
	"admin_backend/internal/usecase"
)

type UserRepository struct {
	mu    sync.RWMutex
	users map[string]domain.User
}

func NewUserRepository() *UserRepository {
	return &UserRepository{
		users: make(map[string]domain.User),
	}
}

func (r *UserRepository) Create(_ context.Context, user domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.users[user.ID] = user
	return nil
}

func (r *UserRepository) GetByID(_ context.Context, id string) (domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, ok := r.users[id]
	if !ok {
		return domain.User{}, usecase.ErrNotFound
	}

	return user, nil
}

func (r *UserRepository) List(_ context.Context) ([]domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	users := make([]domain.User, 0, len(r.users))
	for _, user := range r.users {
		users = append(users, user)
	}

	return users, nil
}
