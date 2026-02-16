package users

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/lib/pq"
)

func (h *Handler) HandleUserByID(w http.ResponseWriter, r *http.Request) {
	trimmedPath := strings.TrimPrefix(r.URL.Path, "/users/")
	if trimmedPath == "" {
		h.respondError(w, http.StatusNotFound, "user not found")
		return
	}

	pathParts := strings.Split(trimmedPath, "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		h.respondError(w, http.StatusNotFound, "user not found")
		return
	}

	id := pathParts[0]
	if len(pathParts) == 2 && pathParts[1] == "profiles" {
		h.handleUserProfiles(w, r, id)
		return
	}
	if len(pathParts) > 1 {
		h.respondError(w, http.StatusNotFound, "user not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var user struct {
			ID      string    `db:"id" json:"id"`
			Name    string    `db:"name" json:"name"`
			Email   string    `db:"email" json:"email"`
			Login   string    `db:"login" json:"login"`
			Phone   string    `db:"phone" json:"phone"`
			Address string    `db:"address" json:"address"`
			Avatar  string    `db:"avatar" json:"avatar"`
			Active  bool      `db:"active" json:"active"`
			Created time.Time `db:"created" json:"created"`
			Updated time.Time `db:"updated" json:"updated"`
		}

		if err := h.db.GetContext(
			r.Context(),
			&user,
			`
			SELECT
			  id,
			  name,
			  email,
			  login,
			  COALESCE(phone, '') AS phone,
			  COALESCE(address, '') AS address,
			  COALESCE(avatar, '') AS avatar,
			  ativo AS active,
			  created,
			  updated
			FROM users
			WHERE id = $1
			LIMIT 1
			`,
			id,
		); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				h.respondError(w, http.StatusNotFound, "user not found")
				return
			}
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, user)
	case http.MethodPatch:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var payload struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Login    string `json:"login"`
			Password string `json:"password"`
			Phone    string `json:"phone"`
			Address  string `json:"address"`
			Avatar   string `json:"avatar"`
			Active   bool   `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		name := strings.TrimSpace(payload.Name)
		email := strings.TrimSpace(payload.Email)
		login := strings.ToLower(strings.TrimSpace(payload.Login))
		password := strings.TrimSpace(payload.Password)
		phone := strings.TrimSpace(payload.Phone)
		address := strings.TrimSpace(payload.Address)
		avatar, err := h.normalizeAvatarInput(payload.Avatar)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		if name == "" || email == "" || login == "" {
			h.respondError(w, http.StatusBadRequest, "name, email and login are required")
			return
		}

		var loginInUse bool
		if err := h.db.GetContext(
			r.Context(),
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
			id,
		); err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if loginInUse {
			h.respondError(w, http.StatusConflict, "login already in use")
			return
		}

		var emailInUse bool
		if err := h.db.GetContext(
			r.Context(),
			&emailInUse,
			`
			SELECT EXISTS (
			  SELECT 1
			  FROM users
			  WHERE LOWER(email) = LOWER($1)
			    AND id <> $2
			)
			`,
			email,
			id,
		); err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if emailInUse {
			h.respondError(w, http.StatusConflict, "email already in use")
			return
		}

		var updatedUser struct {
			ID      string    `db:"id" json:"id"`
			Name    string    `db:"name" json:"name"`
			Email   string    `db:"email" json:"email"`
			Login   string    `db:"login" json:"login"`
			Phone   string    `db:"phone" json:"phone"`
			Address string    `db:"address" json:"address"`
			Avatar  string    `db:"avatar" json:"avatar"`
			Active  bool      `db:"active" json:"active"`
			Created time.Time `db:"created" json:"created"`
			Updated time.Time `db:"updated" json:"updated"`
		}
		if err := h.db.GetContext(
			r.Context(),
			&updatedUser,
			`
			UPDATE users
			SET name = $1,
			    email = $2,
			    login = $3,
			    senha = COALESCE(NULLIF($4, ''), senha),
			    phone = NULLIF($5, ''),
			    address = NULLIF($6, ''),
			    avatar = NULLIF($7, ''),
			    ativo = $8,
			    updated = NOW()
			WHERE id = $9
			RETURNING
			  id,
			  name,
			  email,
			  login,
			  COALESCE(phone, '') AS phone,
			  COALESCE(address, '') AS address,
			  COALESCE(avatar, '') AS avatar,
			  ativo AS active,
			  created,
			  updated
			`,
			name,
			email,
			login,
			password,
			phone,
			address,
			avatar,
			payload.Active,
			id,
		); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				h.respondError(w, http.StatusNotFound, "user not found")
				return
			}

			var pgErr *pq.Error
			if errors.As(err, &pgErr) {
				if pgErr.Constraint == "users_email_key" {
					h.respondError(w, http.StatusConflict, "email already in use")
					return
				}
				if pgErr.Constraint == "users_login_key" || pgErr.Constraint == "users_login_lower_key" {
					h.respondError(w, http.StatusConflict, "login already in use")
					return
				}
				if pgErr.Code == "23505" {
					h.respondError(w, http.StatusConflict, "conflict")
					return
				}
			}

			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, updatedUser)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
