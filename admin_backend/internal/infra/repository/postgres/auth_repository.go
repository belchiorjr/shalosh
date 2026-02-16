package postgres

import (
	"context"
	"database/sql"
	"errors"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type AuthRepository struct {
	db *sqlx.DB
}

func NewAuthRepository(db *sqlx.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) FindByLoginOrEmail(ctx context.Context, login string) (usecase.AuthUser, error) {
	var user struct {
		ID       string `db:"id"`
		Name     string `db:"name"`
		Email    string `db:"email"`
		Login    string `db:"login"`
		Password string `db:"password"`
		Phone    string `db:"phone"`
		Address  string `db:"address"`
		Avatar   string `db:"avatar"`
		Active   bool   `db:"active"`
	}
	if err := r.db.GetContext(
		ctx,
		&user,
		`
		SELECT id, name, email, login, senha AS password, COALESCE(phone, '') AS phone, COALESCE(address, '') AS address, COALESCE(avatar, '') AS avatar, ativo AS active
		FROM users
		WHERE LOWER(login) = LOWER($1) OR LOWER(email) = LOWER($1)
		LIMIT 1
		`,
		login,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.AuthUser{}, usecase.ErrNotFound
		}
		return usecase.AuthUser{}, err
	}

	return usecase.AuthUser{
		ID:       user.ID,
		Name:     user.Name,
		Email:    user.Email,
		Login:    user.Login,
		Password: user.Password,
		Phone:    user.Phone,
		Address:  user.Address,
		Avatar:   user.Avatar,
		Active:   user.Active,
	}, nil
}

func (r *AuthRepository) IsLoginInUseByAnotherUser(
	ctx context.Context,
	login, userID string,
) (bool, error) {
	var loginInUse bool
	if err := r.db.GetContext(
		ctx,
		&loginInUse,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM users
		  WHERE LOWER(login) = LOWER($1)
		    AND id <> $2
		)
		`,
		login,
		userID,
	); err != nil {
		return false, err
	}

	return loginInUse, nil
}

func (r *AuthRepository) UpdateAccount(
	ctx context.Context,
	input usecase.UpdateAccountInput,
) (usecase.AuthUser, error) {
	var user struct {
		ID      string `db:"id"`
		Name    string `db:"name"`
		Email   string `db:"email"`
		Login   string `db:"login"`
		Phone   string `db:"phone"`
		Address string `db:"address"`
		Avatar  string `db:"avatar"`
		Active  bool   `db:"active"`
	}
	if err := r.db.GetContext(
		ctx,
		&user,
		`
		UPDATE users
		SET name = $1,
		    email = $2,
		    login = $3,
		    senha = COALESCE(NULLIF($4, ''), senha),
		    phone = NULLIF($5, ''),
		    address = NULLIF($6, ''),
		    avatar = NULLIF($7, ''),
		    updated = NOW()
		WHERE id = $8
		RETURNING id, name, email, login, COALESCE(phone, '') AS phone, COALESCE(address, '') AS address, COALESCE(avatar, '') AS avatar, ativo AS active
		`,
		input.Name,
		input.Email,
		input.Login,
		input.Password,
		input.Phone,
		input.Address,
		input.Avatar,
		input.UserID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.AuthUser{}, usecase.ErrUnauthorized
		}

		var pgErr *pq.Error
		if errors.As(err, &pgErr) {
			switch pgErr.Constraint {
			case "users_email_key":
				return usecase.AuthUser{}, usecase.ErrEmailInUse
			case "users_login_key", "users_login_lower_key":
				return usecase.AuthUser{}, usecase.ErrLoginInUse
			}
			if pgErr.Code == "23505" {
				return usecase.AuthUser{}, usecase.ErrConflict
			}
		}

		return usecase.AuthUser{}, err
	}

	return usecase.AuthUser{
		ID:      user.ID,
		Name:    user.Name,
		Email:   user.Email,
		Login:   user.Login,
		Phone:   user.Phone,
		Address: user.Address,
		Avatar:  user.Avatar,
		Active:  user.Active,
	}, nil
}
