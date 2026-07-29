package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
)

type PasswordResetRepository struct {
	db *sqlx.DB
}

func NewPasswordResetRepository(db *sqlx.DB) *PasswordResetRepository {
	return &PasswordResetRepository{db: db}
}

type passwordResetAccountRecord struct {
	ID     string `db:"id"`
	Name   string `db:"name"`
	Email  string `db:"email"`
	Active bool   `db:"active"`
}

type passwordResetTokenRecord struct {
	ID        string       `db:"id"`
	Audience  string       `db:"audience"`
	SubjectID string       `db:"subject_id"`
	Email     string       `db:"email"`
	ExpiresAt time.Time    `db:"expires_at"`
	UsedAt    sql.NullTime `db:"used_at"`
}

func (r *PasswordResetRepository) FindAccountByLoginOrEmail(
	ctx context.Context,
	audience, login string,
) (usecase.PasswordResetAccount, error) {
	query := `
		SELECT id, name, COALESCE(email, '') AS email, ativo AS active
		FROM users
		WHERE LOWER(login) = LOWER($1) OR LOWER(email) = LOWER($1)
		LIMIT 1
	`
	if audience == usecase.PasswordResetAudienceClient {
		query = `
		SELECT id, name, COALESCE(email, '') AS email, active
		FROM clients
		WHERE LOWER(login) = LOWER($1) OR LOWER(email) = LOWER($1)
		LIMIT 1
		`
	}

	var record passwordResetAccountRecord
	if err := r.db.GetContext(ctx, &record, query, login); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.PasswordResetAccount{}, usecase.ErrNotFound
		}
		return usecase.PasswordResetAccount{}, err
	}

	return usecase.PasswordResetAccount{
		ID:     record.ID,
		Name:   record.Name,
		Email:  record.Email,
		Active: record.Active,
	}, nil
}

func (r *PasswordResetRepository) InvalidateActiveTokens(
	ctx context.Context,
	audience, subjectID string,
) error {
	_, err := r.db.ExecContext(
		ctx,
		`
		UPDATE password_reset_tokens
		SET used_at = NOW()
		WHERE audience = $1
		  AND subject_id = $2
		  AND used_at IS NULL
		`,
		audience,
		subjectID,
	)

	return err
}

func (r *PasswordResetRepository) CreateToken(
	ctx context.Context,
	input usecase.CreatePasswordResetTokenInput,
) (usecase.PasswordResetToken, error) {
	var record passwordResetTokenRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`
		INSERT INTO password_reset_tokens (
		  audience,
		  subject_id,
		  email,
		  token_hash,
		  expires_at,
		  created
		)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, audience, subject_id, email, expires_at, used_at
		`,
		input.Audience,
		input.SubjectID,
		input.Email,
		input.TokenHash,
		input.ExpiresAt,
	); err != nil {
		return usecase.PasswordResetToken{}, err
	}

	return mapPasswordResetTokenRecord(record), nil
}

func (r *PasswordResetRepository) FindTokenByHash(
	ctx context.Context,
	tokenHash string,
) (usecase.PasswordResetToken, time.Time, error) {
	var record passwordResetTokenRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`
		SELECT id, audience, subject_id, email, expires_at, used_at
		FROM password_reset_tokens
		WHERE token_hash = $1
		LIMIT 1
		`,
		tokenHash,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.PasswordResetToken{}, time.Time{}, usecase.ErrNotFound
		}
		return usecase.PasswordResetToken{}, time.Time{}, err
	}

	var usedAt time.Time
	if record.UsedAt.Valid {
		usedAt = record.UsedAt.Time
	}

	return mapPasswordResetTokenRecord(record), usedAt, nil
}

// ConsumeTokenAndUpdatePassword marca o token como usado e grava a nova senha na
// mesma transação; a cláusula used_at IS NULL impede uso concorrente do token.
func (r *PasswordResetRepository) ConsumeTokenAndUpdatePassword(
	ctx context.Context,
	tokenID, audience, subjectID, password string,
) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	result, err := tx.ExecContext(
		ctx,
		`
		UPDATE password_reset_tokens
		SET used_at = NOW()
		WHERE id = $1 AND used_at IS NULL
		`,
		tokenID,
	)
	if err != nil {
		_ = tx.Rollback()
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		_ = tx.Rollback()
		return err
	}
	if affected == 0 {
		_ = tx.Rollback()
		return usecase.ErrResetTokenInvalid
	}

	updatePassword := `UPDATE users SET senha = $1, updated = NOW() WHERE id = $2`
	if audience == usecase.PasswordResetAudienceClient {
		updatePassword = `UPDATE clients SET password = $1, updated = NOW() WHERE id = $2`
	}

	if _, err := tx.ExecContext(ctx, updatePassword, password, subjectID); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}

func mapPasswordResetTokenRecord(record passwordResetTokenRecord) usecase.PasswordResetToken {
	return usecase.PasswordResetToken{
		ID:        record.ID,
		Audience:  record.Audience,
		SubjectID: record.SubjectID,
		Email:     record.Email,
		ExpiresAt: record.ExpiresAt.UTC(),
	}
}
