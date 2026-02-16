package users

import (
	"net/http"
	"time"
)

func (h *Handler) HandleActiveUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

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
		WHERE ativo = TRUE
		ORDER BY created DESC, id DESC
		`,
	); err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	h.respondJSON(w, http.StatusOK, users)
}
