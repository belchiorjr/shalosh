package postgres

import (
	"context"
	"errors"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type UserProfileRepository struct {
	db *sqlx.DB
}

func NewUserProfileRepository(db *sqlx.DB) *UserProfileRepository {
	return &UserProfileRepository{db: db}
}

func (r *UserProfileRepository) ListProfilesByUserID(
	ctx context.Context,
	userID string,
) ([]usecase.UserProfile, error) {
	var records []struct {
		ID          string `db:"id"`
		Name        string `db:"name"`
		Description string `db:"description"`
		Active      bool   `db:"active"`
	}
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  p.id,
		  p.name,
		  p.description,
		  p.active
		FROM user_profiles up
		INNER JOIN profiles p ON p.id = up.profile_id
		WHERE up.user_id = $1
		ORDER BY p.name ASC
		`,
		userID,
	); err != nil {
		return nil, err
	}

	profiles := make([]usecase.UserProfile, 0, len(records))
	for _, record := range records {
		profiles = append(profiles, usecase.UserProfile{
			ID:          record.ID,
			Name:        record.Name,
			Description: record.Description,
			Active:      record.Active,
		})
	}

	return profiles, nil
}

func (r *UserProfileRepository) UserExists(ctx context.Context, userID string) (bool, error) {
	var exists bool
	if err := r.db.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)",
		userID,
	); err != nil {
		return false, err
	}

	return exists, nil
}

func (r *UserProfileRepository) ListProfileIDsByUserID(
	ctx context.Context,
	userID string,
) ([]string, error) {
	var profileIDs []string
	if err := r.db.SelectContext(
		ctx,
		&profileIDs,
		`
		SELECT profile_id
		FROM user_profiles
		WHERE user_id = $1
		ORDER BY profile_id
		`,
		userID,
	); err != nil {
		return nil, err
	}

	return profileIDs, nil
}

func (r *UserProfileRepository) ReplaceUserProfileIDs(
	ctx context.Context,
	userID string,
	profileIDs []string,
) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var userExists bool
	if err := tx.GetContext(
		ctx,
		&userExists,
		"SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)",
		userID,
	); err != nil {
		return err
	}
	if !userExists {
		return usecase.ErrNotFound
	}

	if _, err := tx.ExecContext(
		ctx,
		"DELETE FROM user_profiles WHERE user_id = $1",
		userID,
	); err != nil {
		return err
	}

	for _, profileID := range profileIDs {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO user_profiles (user_id, profile_id, created)
			VALUES ($1, $2, NOW())
			`,
			userID,
			profileID,
		); err != nil {
			var pgErr *pq.Error
			if errors.As(err, &pgErr) && pgErr.Code == "23503" {
				return usecase.ErrProfilesNotFound
			}
			return err
		}
	}

	if _, err := tx.ExecContext(
		ctx,
		"UPDATE users SET updated = NOW() WHERE id = $1",
		userID,
	); err != nil {
		return err
	}

	return tx.Commit()
}
