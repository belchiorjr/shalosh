package postgres

import (
	"context"

	"github.com/jmoiron/sqlx"
)

type AuthorizationRepository struct {
	db *sqlx.DB
}

func NewAuthorizationRepository(db *sqlx.DB) *AuthorizationRepository {
	return &AuthorizationRepository{db: db}
}

func (r *AuthorizationRepository) IsUserAdministrator(ctx context.Context, userID string) (bool, error) {
	var isAdministrator bool
	if err := r.db.GetContext(
		ctx,
		&isAdministrator,
		`
			SELECT EXISTS (
			  SELECT 1
			  FROM user_profiles up
			  INNER JOIN profiles p ON p.id = up.profile_id
			  WHERE up.user_id = $1
			    AND p.active = TRUE
			    AND (
			      LOWER(p.name) = LOWER('administrator')
			      OR LOWER(p.name) = LOWER('administrador')
			    )
			)
			`,
		userID,
	); err != nil {
		return false, err
	}

	return isAdministrator, nil
}

func (r *AuthorizationRepository) HasUserPermission(
	ctx context.Context,
	userID,
	permissionCode string,
) (bool, error) {
	isAdministrator, err := r.IsUserAdministrator(ctx, userID)
	if err != nil {
		return false, err
	}
	if isAdministrator {
		return true, nil
	}

	var hasPermission bool
	if err := r.db.GetContext(
		ctx,
		&hasPermission,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM user_profiles up
		  INNER JOIN profiles profile ON profile.id = up.profile_id
		  INNER JOIN profile_permissions profile_permission ON profile_permission.profile_id = profile.id
		  INNER JOIN permissions permission ON permission.id = profile_permission.permission_id
		  WHERE up.user_id = $1
		    AND profile.active = TRUE
		    AND permission.active = TRUE
		    AND LOWER(permission.code) = LOWER($2)
		)
		`,
		userID,
		permissionCode,
	); err != nil {
		return false, err
	}

	return hasPermission, nil
}
