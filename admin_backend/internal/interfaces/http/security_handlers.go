package http

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/lib/pq"
)

type permissionRecord struct {
	ID          string    `db:"id" json:"id"`
	Code        string    `db:"code" json:"code"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description" json:"description"`
	Active      bool      `db:"active" json:"active"`
	Created     time.Time `db:"created" json:"created"`
	Updated     time.Time `db:"updated" json:"updated"`
}

type profileRecord struct {
	ID              string    `db:"id" json:"id"`
	Name            string    `db:"name" json:"name"`
	Description     string    `db:"description" json:"description"`
	Active          bool      `db:"active" json:"active"`
	Created         time.Time `db:"created" json:"created"`
	Updated         time.Time `db:"updated" json:"updated"`
	PermissionCount int       `db:"permission_count" json:"permissionCount"`
}

func (h *UserHandler) handlePermissions(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var permissions []permissionRecord
		if err := h.db.SelectContext(
			r.Context(),
			&permissions,
			`
			SELECT id, code, name, description, active, created, updated
			FROM permissions
			ORDER BY created DESC, id DESC
			`,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, permissions)
	case http.MethodPost:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var payload struct {
			Code        string `json:"code"`
			Name        string `json:"name"`
			Description string `json:"description"`
			Active      *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		code := strings.ToLower(strings.TrimSpace(payload.Code))
		name := strings.TrimSpace(payload.Name)
		description := strings.TrimSpace(payload.Description)
		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		if code == "" || name == "" {
			respondError(w, http.StatusBadRequest, "code and name are required")
			return
		}

		permissionID := newEntityID("perm")

		var createdPermission permissionRecord
		if err := h.db.GetContext(
			r.Context(),
			&createdPermission,
			`
			INSERT INTO permissions (id, code, name, description, active, created, updated)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			RETURNING id, code, name, description, active, created, updated
			`,
			permissionID,
			code,
			name,
			description,
			active,
		); err != nil {
			var pgErr *pq.Error
			if errors.As(err, &pgErr) {
				if pgErr.Constraint == "permissions_code_lower_key" {
					respondError(w, http.StatusConflict, "permission code already in use")
					return
				}
				if pgErr.Constraint == "permissions_name_lower_key" {
					respondError(w, http.StatusConflict, "permission name already in use")
					return
				}
			}

			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusCreated, createdPermission)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handlePermissionByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/permissions/")
	if id == "" || strings.Contains(id, "/") {
		respondError(w, http.StatusNotFound, "permission not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var permission permissionRecord
		if err := h.db.GetContext(
			r.Context(),
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
				respondError(w, http.StatusNotFound, "permission not found")
				return
			}
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, permission)
	case http.MethodPatch:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var payload struct {
			Code        string `json:"code"`
			Name        string `json:"name"`
			Description string `json:"description"`
			Active      *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		code := strings.ToLower(strings.TrimSpace(payload.Code))
		name := strings.TrimSpace(payload.Name)
		description := strings.TrimSpace(payload.Description)

		if code == "" || name == "" {
			respondError(w, http.StatusBadRequest, "code and name are required")
			return
		}

		var updatedPermission permissionRecord
		if err := h.db.GetContext(
			r.Context(),
			&updatedPermission,
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
			code,
			name,
			description,
			payload.Active,
			id,
		); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				respondError(w, http.StatusNotFound, "permission not found")
				return
			}

			var pgErr *pq.Error
			if errors.As(err, &pgErr) {
				if pgErr.Constraint == "permissions_code_lower_key" {
					respondError(w, http.StatusConflict, "permission code already in use")
					return
				}
				if pgErr.Constraint == "permissions_name_lower_key" {
					respondError(w, http.StatusConflict, "permission name already in use")
					return
				}
			}

			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, updatedPermission)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handleProfiles(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var profiles []profileRecord
		if err := h.db.SelectContext(
			r.Context(),
			&profiles,
			`
			SELECT
			  p.id,
			  p.name,
			  p.description,
			  p.active,
			  p.created,
			  p.updated,
			  COALESCE(COUNT(pp.permission_id), 0)::int AS permission_count
			FROM profiles p
			LEFT JOIN profile_permissions pp ON pp.profile_id = p.id
			GROUP BY p.id, p.name, p.description, p.active, p.created, p.updated
			ORDER BY p.created DESC, p.id DESC
			`,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, profiles)
	case http.MethodPost:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var payload struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Active      *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		name := strings.TrimSpace(payload.Name)
		description := strings.TrimSpace(payload.Description)
		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		if name == "" {
			respondError(w, http.StatusBadRequest, "name is required")
			return
		}

		profileID := newEntityID("prof")
		var createdProfile profileRecord
		if err := h.db.GetContext(
			r.Context(),
			&createdProfile,
			`
			INSERT INTO profiles (id, name, description, active, created, updated)
			VALUES ($1, $2, $3, $4, NOW(), NOW())
			RETURNING id, name, description, active, created, updated, 0::int AS permission_count
			`,
			profileID,
			name,
			description,
			active,
		); err != nil {
			var pgErr *pq.Error
			if errors.As(err, &pgErr) {
				if pgErr.Constraint == "profiles_name_lower_key" {
					respondError(w, http.StatusConflict, "profile name already in use")
					return
				}
			}

			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusCreated, createdProfile)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handleProfileByID(w http.ResponseWriter, r *http.Request) {
	trimmedPath := strings.TrimPrefix(r.URL.Path, "/profiles/")
	if trimmedPath == "" {
		respondError(w, http.StatusNotFound, "profile not found")
		return
	}

	pathParts := strings.Split(trimmedPath, "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		respondError(w, http.StatusNotFound, "profile not found")
		return
	}

	profileID := pathParts[0]
	if len(pathParts) == 2 && pathParts[1] == "permissions" {
		h.handleProfilePermissions(w, r, profileID)
		return
	}
	if len(pathParts) > 1 {
		respondError(w, http.StatusNotFound, "profile not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var profile profileRecord
		if err := h.db.GetContext(
			r.Context(),
			&profile,
			`
			SELECT
			  p.id,
			  p.name,
			  p.description,
			  p.active,
			  p.created,
			  p.updated,
			  COALESCE(COUNT(pp.permission_id), 0)::int AS permission_count
			FROM profiles p
			LEFT JOIN profile_permissions pp ON pp.profile_id = p.id
			WHERE p.id = $1
			GROUP BY p.id, p.name, p.description, p.active, p.created, p.updated
			LIMIT 1
			`,
			profileID,
		); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				respondError(w, http.StatusNotFound, "profile not found")
				return
			}
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, profile)
	case http.MethodPatch:
		claims, err := h.authorizeRequest(r)
		if err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		isAdministrator, err := h.isUserAdministrator(r.Context(), claims.Sub)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !isAdministrator {
			respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		var payload struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Active      *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		name := strings.TrimSpace(payload.Name)
		description := strings.TrimSpace(payload.Description)

		if name == "" {
			respondError(w, http.StatusBadRequest, "name is required")
			return
		}

		var updatedProfile profileRecord
		if err := h.db.GetContext(
			r.Context(),
			&updatedProfile,
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
			  (SELECT COUNT(*)::int FROM profile_permissions WHERE profile_id = profiles.id) AS permission_count
			`,
			name,
			description,
			payload.Active,
			profileID,
		); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				respondError(w, http.StatusNotFound, "profile not found")
				return
			}

			var pgErr *pq.Error
			if errors.As(err, &pgErr) {
				if pgErr.Constraint == "profiles_name_lower_key" {
					respondError(w, http.StatusConflict, "profile name already in use")
					return
				}
			}

			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, updatedProfile)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handleProfilePermissions(w http.ResponseWriter, r *http.Request, profileID string) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var permissionIDs []string
		if err := h.db.SelectContext(
			r.Context(),
			&permissionIDs,
			`
			SELECT permission_id
			FROM profile_permissions
			WHERE profile_id = $1
			ORDER BY permission_id
			`,
			profileID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"profileId":     profileID,
			"permissionIds": permissionIDs,
		})
	case http.MethodPut:
		claims, err := h.authorizeRequest(r)
		if err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		isAdministrator, err := h.isUserAdministrator(r.Context(), claims.Sub)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !isAdministrator {
			respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		var payload struct {
			PermissionIDs []string `json:"permissionIds"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		normalizedPermissionIDs := normalizeIDList(payload.PermissionIDs)

		tx, err := h.db.BeginTxx(r.Context(), nil)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		defer tx.Rollback()

		var profileExists bool
		if err := tx.GetContext(
			r.Context(),
			&profileExists,
			"SELECT EXISTS (SELECT 1 FROM profiles WHERE id = $1)",
			profileID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !profileExists {
			respondError(w, http.StatusNotFound, "profile not found")
			return
		}

		if _, err := tx.ExecContext(
			r.Context(),
			"DELETE FROM profile_permissions WHERE profile_id = $1",
			profileID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		for _, permissionID := range normalizedPermissionIDs {
			if _, err := tx.ExecContext(
				r.Context(),
				`
				INSERT INTO profile_permissions (profile_id, permission_id, created)
				VALUES ($1, $2, NOW())
				`,
				profileID,
				permissionID,
			); err != nil {
				var pgErr *pq.Error
				if errors.As(err, &pgErr) && pgErr.Code == "23503" {
					respondError(w, http.StatusBadRequest, "one or more permissions do not exist")
					return
				}
				respondError(w, http.StatusInternalServerError, "unexpected error")
				return
			}
		}

		if _, err := tx.ExecContext(
			r.Context(),
			"UPDATE profiles SET updated = NOW() WHERE id = $1",
			profileID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		if err := tx.Commit(); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"profileId":     profileID,
			"permissionIds": normalizedPermissionIDs,
		})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func normalizeIDList(values []string) []string {
	seen := make(map[string]struct{})
	normalized := make([]string, 0, len(values))

	for _, value := range values {
		id := strings.TrimSpace(value)
		if id == "" {
			continue
		}
		if _, alreadyAdded := seen[id]; alreadyAdded {
			continue
		}
		seen[id] = struct{}{}
		normalized = append(normalized, id)
	}

	return normalized
}

func newEntityID(prefix string) string {
	return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
}
