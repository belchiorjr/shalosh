package postgres

import (
	"context"
	"database/sql"
	"errors"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
)

type EmailSettingsRepository struct {
	db *sqlx.DB
}

func NewEmailSettingsRepository(db *sqlx.DB) *EmailSettingsRepository {
	return &EmailSettingsRepository{db: db}
}

type emailSettingsRecord struct {
	ID              string `db:"id"`
	Provider        string `db:"provider"`
	APIURL          string `db:"api_url"`
	AuthUser        string `db:"auth_user"`
	AuthPassword    string `db:"auth_password"`
	FromEmail       string `db:"from_email"`
	FromName        string `db:"from_name"`
	AdminResetURL   string `db:"admin_reset_url"`
	ClientResetURL  string `db:"client_reset_url"`
	TokenTTLMinutes int    `db:"token_ttl_minutes"`
	Active          bool   `db:"active"`
}

const emailSettingsColumns = `
	  id,
	  provider,
	  api_url,
	  auth_user,
	  auth_password,
	  from_email,
	  from_name,
	  admin_reset_url,
	  client_reset_url,
	  token_ttl_minutes,
	  active
`

func (r *EmailSettingsRepository) Get(ctx context.Context) (usecase.EmailSettings, error) {
	var record emailSettingsRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`SELECT`+emailSettingsColumns+`FROM email_settings ORDER BY created LIMIT 1`,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return r.insertDefault(ctx)
		}
		return usecase.EmailSettings{}, err
	}

	return mapEmailSettingsRecord(record), nil
}

func (r *EmailSettingsRepository) Update(
	ctx context.Context,
	input usecase.UpdateEmailSettingsInput,
) (usecase.EmailSettings, error) {
	if _, err := r.Get(ctx); err != nil {
		return usecase.EmailSettings{}, err
	}

	var record emailSettingsRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`
		UPDATE email_settings
		SET api_url = $1,
		    auth_user = $2,
		    auth_password = COALESCE(NULLIF($3, ''), auth_password),
		    from_email = $4,
		    from_name = $5,
		    admin_reset_url = $6,
		    client_reset_url = $7,
		    token_ttl_minutes = $8,
		    active = $9,
		    updated = NOW()
		WHERE id = (SELECT id FROM email_settings ORDER BY created LIMIT 1)
		RETURNING`+emailSettingsColumns,
		input.APIURL,
		input.AuthUser,
		input.AuthPassword,
		input.FromEmail,
		input.FromName,
		input.AdminResetURL,
		input.ClientResetURL,
		input.TokenTTLMinutes,
		input.Active,
	); err != nil {
		return usecase.EmailSettings{}, err
	}

	return mapEmailSettingsRecord(record), nil
}

func (r *EmailSettingsRepository) insertDefault(ctx context.Context) (usecase.EmailSettings, error) {
	var record emailSettingsRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`
		INSERT INTO email_settings (provider, created, updated)
		VALUES ('turbosmtp', NOW(), NOW())
		RETURNING`+emailSettingsColumns,
	); err != nil {
		return usecase.EmailSettings{}, err
	}

	return mapEmailSettingsRecord(record), nil
}

func mapEmailSettingsRecord(record emailSettingsRecord) usecase.EmailSettings {
	return usecase.EmailSettings{
		ID:              record.ID,
		Provider:        record.Provider,
		APIURL:          record.APIURL,
		AuthUser:        record.AuthUser,
		AuthPassword:    record.AuthPassword,
		FromEmail:       record.FromEmail,
		FromName:        record.FromName,
		AdminResetURL:   record.AdminResetURL,
		ClientResetURL:  record.ClientResetURL,
		TokenTTLMinutes: record.TokenTTLMinutes,
		Active:          record.Active,
	}
}
