package postgres

import (
	"context"
	"database/sql"
	"errors"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type SecurityRepository struct {
	db *sqlx.DB
}

func NewSecurityRepository(db *sqlx.DB) *SecurityRepository {
	return &SecurityRepository{
		db: db,
	}
}

func (r *SecurityRepository) ListPermissions(ctx context.Context) ([]usecase.Permission, error) {
	var permissions []usecase.Permission
	if err := r.db.SelectContext(
		ctx,
		&permissions,
		`
		SELECT id, code, name, description, active, created, updated
		FROM permissions
		ORDER BY created DESC, id DESC
		`,
	); err != nil {
		return nil, err
	}

	return permissions, nil
}

func (r *SecurityRepository) CreatePermission(
	ctx context.Context,
	input usecase.CreatePermissionInput,
) (usecase.Permission, error) {
	var permission usecase.Permission
	if err := r.db.GetContext(
		ctx,
		&permission,
		`
		INSERT INTO permissions (code, name, description, active, created, updated)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, code, name, description, active, created, updated
		`,
		input.Code,
		input.Name,
		input.Description,
		input.Active,
	); err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) {
			switch pgErr.Constraint {
			case "permissions_code_lower_key":
				return usecase.Permission{}, usecase.ErrPermissionCodeInUse
			case "permissions_name_lower_key":
				return usecase.Permission{}, usecase.ErrPermissionNameInUse
			}
		}

		return usecase.Permission{}, err
	}

	return permission, nil
}

func (r *SecurityRepository) GetPermissionByID(ctx context.Context, id string) (usecase.Permission, error) {
	var permission usecase.Permission
	if err := r.db.GetContext(
		ctx,
		&permission,
		`
		SELECT id, code, name, description, active, created, updated
		FROM permissions
		WHERE id = $1
		LIMIT 1
		`,
		id,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.Permission{}, usecase.ErrNotFound
		}
		return usecase.Permission{}, err
	}

	return permission, nil
}

func (r *SecurityRepository) UpdatePermission(
	ctx context.Context,
	input usecase.UpdatePermissionInput,
) (usecase.Permission, error) {
	var permission usecase.Permission
	if err := r.db.GetContext(
		ctx,
		&permission,
		`
		UPDATE permissions
		SET code = $1,
		    name = $2,
		    description = $3,
		    active = COALESCE($4::boolean, active),
		    updated = NOW()
		WHERE id = $5
		RETURNING id, code, name, description, active, created, updated
		`,
		input.Code,
		input.Name,
		input.Description,
		input.Active,
		input.ID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.Permission{}, usecase.ErrNotFound
		}

		var pgErr *pq.Error
		if errors.As(err, &pgErr) {
			switch pgErr.Constraint {
			case "permissions_code_lower_key":
				return usecase.Permission{}, usecase.ErrPermissionCodeInUse
			case "permissions_name_lower_key":
				return usecase.Permission{}, usecase.ErrPermissionNameInUse
			}
		}

		return usecase.Permission{}, err
	}

	return permission, nil
}

func (r *SecurityRepository) ListProfiles(ctx context.Context) ([]usecase.Profile, error) {
	var profiles []usecase.Profile
	if err := r.db.SelectContext(
		ctx,
		&profiles,
		`
		SELECT
		  p.id,
		  p.name,
		  p.description,
		  p.active,
		  p.created,
		  p.updated,
		  COALESCE(COUNT(pp.permission_id), 0)::int AS permissioncount
		FROM profiles p
		LEFT JOIN profile_permissions pp ON pp.profile_id = p.id
		GROUP BY p.id, p.name, p.description, p.active, p.created, p.updated
		ORDER BY p.created DESC, p.id DESC
		`,
	); err != nil {
		return nil, err
	}

	return profiles, nil
}

func (r *SecurityRepository) CreateProfile(
	ctx context.Context,
	input usecase.CreateProfileInput,
) (usecase.Profile, error) {
	var profile usecase.Profile
	if err := r.db.GetContext(
		ctx,
		&profile,
		`
		INSERT INTO profiles (name, description, active, created, updated)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, name, description, active, created, updated, 0::int AS permissioncount
		`,
		input.Name,
		input.Description,
		input.Active,
	); err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Constraint == "profiles_name_lower_key" {
			return usecase.Profile{}, usecase.ErrProfileNameInUse
		}

		return usecase.Profile{}, err
	}

	return profile, nil
}

func (r *SecurityRepository) GetProfileByID(ctx context.Context, id string) (usecase.Profile, error) {
	var profile usecase.Profile
	if err := r.db.GetContext(
		ctx,
		&profile,
		`
		SELECT
		  p.id,
		  p.name,
		  p.description,
		  p.active,
		  p.created,
		  p.updated,
		  COALESCE(COUNT(pp.permission_id), 0)::int AS permissioncount
		FROM profiles p
		LEFT JOIN profile_permissions pp ON pp.profile_id = p.id
		WHERE p.id = $1
		GROUP BY p.id, p.name, p.description, p.active, p.created, p.updated
		LIMIT 1
		`,
		id,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.Profile{}, usecase.ErrNotFound
		}
		return usecase.Profile{}, err
	}

	return profile, nil
}

func (r *SecurityRepository) UpdateProfile(
	ctx context.Context,
	input usecase.UpdateProfileInput,
) (usecase.Profile, error) {
	var profile usecase.Profile
	if err := r.db.GetContext(
		ctx,
		&profile,
		`
		UPDATE profiles
		SET name = $1,
		    description = $2,
		    active = COALESCE($3::boolean, active),
		    updated = NOW()
		WHERE id = $4
		RETURNING
		  id,
		  name,
		  description,
		  active,
		  created,
		  updated,
		  (SELECT COUNT(*)::int FROM profile_permissions WHERE profile_id = profiles.id) AS permissioncount
		`,
		input.Name,
		input.Description,
		input.Active,
		input.ID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.Profile{}, usecase.ErrNotFound
		}

		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Constraint == "profiles_name_lower_key" {
			return usecase.Profile{}, usecase.ErrProfileNameInUse
		}

		return usecase.Profile{}, err
	}

	return profile, nil
}

func (r *SecurityRepository) ListProfilePermissionIDs(
	ctx context.Context,
	profileID string,
) ([]string, error) {
	var permissionIDs []string
	if err := r.db.SelectContext(
		ctx,
		&permissionIDs,
		`
		SELECT permission_id
		FROM profile_permissions
		WHERE profile_id = $1
		ORDER BY permission_id
		`,
		profileID,
	); err != nil {
		return nil, err
	}

	return permissionIDs, nil
}

func (r *SecurityRepository) ReplaceProfilePermissionIDs(
	ctx context.Context,
	profileID string,
	permissionIDs []string,
) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var profileExists bool
	if err := tx.GetContext(
		ctx,
		&profileExists,
		"SELECT EXISTS (SELECT 1 FROM profiles WHERE id = $1)",
		profileID,
	); err != nil {
		return err
	}
	if !profileExists {
		return usecase.ErrNotFound
	}

	if _, err := tx.ExecContext(
		ctx,
		"DELETE FROM profile_permissions WHERE profile_id = $1",
		profileID,
	); err != nil {
		return err
	}

	for _, permissionID := range permissionIDs {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO profile_permissions (profile_id, permission_id, created)
			VALUES ($1, $2, NOW())
			`,
			profileID,
			permissionID,
		); err != nil {
			var pgErr *pq.Error
			if errors.As(err, &pgErr) && pgErr.Code == "23503" {
				return usecase.ErrPermissionsNotFound
			}

			return err
		}
	}

	if _, err := tx.ExecContext(
		ctx,
		"UPDATE profiles SET updated = NOW() WHERE id = $1",
		profileID,
	); err != nil {
		return err
	}

	return tx.Commit()
}
