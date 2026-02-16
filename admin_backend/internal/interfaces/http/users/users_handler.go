package users

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/lib/pq"
)

func (h *Handler) HandleUsers(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var users []struct {
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

		if err := h.db.SelectContext(
			r.Context(),
			&users,
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
			ORDER BY created DESC, id DESC
			`,
		); err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, users)
	case http.MethodPost:
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

		if name == "" || email == "" || login == "" || password == "" {
			h.respondError(w, http.StatusBadRequest, "name, email, login and password are required")
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
			)
			`,
			login,
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
			)
			`,
			email,
		); err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if emailInUse {
			h.respondError(w, http.StatusConflict, "email already in use")
			return
		}

		var createdUser struct {
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
			&createdUser,
			`
			INSERT INTO users (
			  name,
			  email,
			  login,
			  senha,
			  phone,
			  address,
			  avatar,
			  ativo,
			  created,
			  updated
			)
			VALUES (
			  $1,
			  $2,
			  $3,
			  $4,
			  NULLIF($5, ''),
			  NULLIF($6, ''),
			  NULLIF($7, ''),
			  $8,
			  NOW(),
			  NOW()
			)
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
		); err != nil {
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

		h.respondJSON(w, http.StatusCreated, createdUser)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
