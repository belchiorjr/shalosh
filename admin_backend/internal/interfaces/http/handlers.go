package http

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type UserHandler struct {
	service      *usecase.UserService
	db           *sqlx.DB
	tokenManager *auth.TokenManager
}

const maxAvatarBytes = 1 * 1024 * 1024

func NewUserHandler(service *usecase.UserService, db *sqlx.DB, tokenManager *auth.TokenManager) *UserHandler {
	return &UserHandler{
		service:      service,
		db:           db,
		tokenManager: tokenManager,
	}
}

func (h *UserHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", h.handleHealth)
	mux.HandleFunc("/auth/login", h.handleLogin)
	mux.HandleFunc("/auth/account", h.handleAccount)
	mux.HandleFunc("/auth/me/profiles", h.handleAuthMyProfiles)
	mux.HandleFunc("/users", h.handleUsers)
	mux.HandleFunc("/users/active", h.handleActiveUsers)
	mux.HandleFunc("/users/", h.handleUserByID)
	mux.HandleFunc("/permissions", h.handlePermissions)
	mux.HandleFunc("/permissions/", h.handlePermissionByID)
	mux.HandleFunc("/profiles", h.handleProfiles)
	mux.HandleFunc("/profiles/", h.handleProfileByID)
}

func (h *UserHandler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *UserHandler) handleUsers(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
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
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, users)
	case http.MethodPost:
		var payload struct {
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		user, err := h.service.Register(r.Context(), usecase.RegisterUserInput{
			Name:  payload.Name,
			Email: payload.Email,
		})
		if err != nil {
			h.handleUsecaseError(w, err)
			return
		}

		respondJSON(w, http.StatusCreated, user)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handleActiveUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	if _, err := h.authorizeRequest(r); err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
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
		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	respondJSON(w, http.StatusOK, users)
}

func (h *UserHandler) handleUserByID(w http.ResponseWriter, r *http.Request) {
	trimmedPath := strings.TrimPrefix(r.URL.Path, "/users/")
	if trimmedPath == "" {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	pathParts := strings.Split(trimmedPath, "/")
	if len(pathParts) == 0 || pathParts[0] == "" {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	id := pathParts[0]
	if len(pathParts) == 2 && pathParts[1] == "profiles" {
		h.handleUserProfiles(w, r, id)
		return
	}
	if len(pathParts) > 1 {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
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
				respondError(w, http.StatusNotFound, "user not found")
				return
			}
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, user)
	case http.MethodPatch:
		if _, err := h.authorizeRequest(r); err != nil {
			respondError(w, http.StatusUnauthorized, "unauthorized")
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
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		name := strings.TrimSpace(payload.Name)
		email := strings.TrimSpace(payload.Email)
		login := strings.ToLower(strings.TrimSpace(payload.Login))
		password := strings.TrimSpace(payload.Password)
		phone := strings.TrimSpace(payload.Phone)
		address := strings.TrimSpace(payload.Address)
		avatar, err := normalizeAvatarInput(payload.Avatar)
		if err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		if name == "" || email == "" || login == "" {
			respondError(w, http.StatusBadRequest, "name, email and login are required")
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
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if loginInUse {
			respondError(w, http.StatusConflict, "login already in use")
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
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if emailInUse {
			respondError(w, http.StatusConflict, "email already in use")
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
				respondError(w, http.StatusNotFound, "user not found")
				return
			}

			var pgErr *pq.Error
			if errors.As(err, &pgErr) {
				if pgErr.Constraint == "users_email_key" {
					respondError(w, http.StatusConflict, "email already in use")
					return
				}
				if pgErr.Constraint == "users_login_key" || pgErr.Constraint == "users_login_lower_key" {
					respondError(w, http.StatusConflict, "login already in use")
					return
				}
				if pgErr.Code == "23505" {
					respondError(w, http.StatusConflict, "conflict")
					return
				}
			}

			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, updatedUser)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handleAuthMyProfiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	claims, err := h.authorizeRequest(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var profiles []struct {
		ID          string `db:"id" json:"id"`
		Name        string `db:"name" json:"name"`
		Description string `db:"description" json:"description"`
		Active      bool   `db:"active" json:"active"`
	}
	if err := h.db.SelectContext(
		r.Context(),
		&profiles,
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
		claims.Sub,
	); err != nil {
		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	isAdministrator, err := h.isUserAdministrator(r.Context(), claims.Sub)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	profileIDs := make([]string, 0, len(profiles))
	for _, profile := range profiles {
		profileIDs = append(profileIDs, profile.ID)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"userId":          claims.Sub,
		"isAdministrator": isAdministrator,
		"profileIds":      profileIDs,
		"profiles":        profiles,
	})
}

func (h *UserHandler) handleUserProfiles(w http.ResponseWriter, r *http.Request, userID string) {
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

	switch r.Method {
	case http.MethodGet:
		var userExists bool
		if err := h.db.GetContext(
			r.Context(),
			&userExists,
			"SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)",
			userID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !userExists {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		var profileIDs []string
		if err := h.db.SelectContext(
			r.Context(),
			&profileIDs,
			`
			SELECT profile_id
			FROM user_profiles
			WHERE user_id = $1
			ORDER BY profile_id
			`,
			userID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"userId":     userID,
			"profileIds": profileIDs,
		})
	case http.MethodPut:
		var payload struct {
			ProfileIDs []string `json:"profileIds"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		normalizedProfileIDs := normalizeIDList(payload.ProfileIDs)

		tx, err := h.db.BeginTxx(r.Context(), nil)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		defer tx.Rollback()

		var userExists bool
		if err := tx.GetContext(
			r.Context(),
			&userExists,
			"SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)",
			userID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}
		if !userExists {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		if _, err := tx.ExecContext(
			r.Context(),
			"DELETE FROM user_profiles WHERE user_id = $1",
			userID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		for _, profileID := range normalizedProfileIDs {
			if _, err := tx.ExecContext(
				r.Context(),
				`
				INSERT INTO user_profiles (user_id, profile_id, created)
				VALUES ($1, $2, NOW())
				`,
				userID,
				profileID,
			); err != nil {
				var pgErr *pq.Error
				if errors.As(err, &pgErr) && pgErr.Code == "23503" {
					respondError(w, http.StatusBadRequest, "one or more profiles do not exist")
					return
				}
				respondError(w, http.StatusInternalServerError, "unexpected error")
				return
			}
		}

		if _, err := tx.ExecContext(
			r.Context(),
			"UPDATE users SET updated = NOW() WHERE id = $1",
			userID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		if err := tx.Commit(); err != nil {
			respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"userId":     userID,
			"profileIds": normalizedProfileIDs,
		})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	login := strings.TrimSpace(payload.Login)
	password := strings.TrimSpace(payload.Password)
	if login == "" || password == "" {
		respondError(w, http.StatusBadRequest, "login and password are required")
		return
	}

	var dbUser struct {
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
	err := h.db.GetContext(
		r.Context(),
		&dbUser,
		`
		SELECT id, name, email, login, senha AS password, COALESCE(phone, '') AS phone, COALESCE(address, '') AS address, COALESCE(avatar, '') AS avatar, ativo AS active
		FROM users
		WHERE LOWER(login) = LOWER($1) OR LOWER(email) = LOWER($1)
		LIMIT 1
		`,
		login,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	if !dbUser.Active || dbUser.Password != password {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, expiresAt, err := h.tokenManager.Generate(dbUser.ID, dbUser.Login, dbUser.Name, time.Now())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":     token,
		"tokenType": "Bearer",
		"expiresAt": expiresAt.UTC().Format(time.RFC3339),
		"user": map[string]interface{}{
			"id":      dbUser.ID,
			"name":    dbUser.Name,
			"email":   dbUser.Email,
			"login":   dbUser.Login,
			"phone":   dbUser.Phone,
			"address": dbUser.Address,
			"avatar":  dbUser.Avatar,
			"active":  dbUser.Active,
		},
	})
}

func (h *UserHandler) handleAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	claims, err := h.authorizeRequest(r)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
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
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	name := strings.TrimSpace(payload.Name)
	email := strings.TrimSpace(payload.Email)
	login := strings.ToLower(strings.TrimSpace(payload.Login))
	password := strings.TrimSpace(payload.Password)
	phone := strings.TrimSpace(payload.Phone)
	address := strings.TrimSpace(payload.Address)
	avatar, err := normalizeAvatarInput(payload.Avatar)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if name == "" || email == "" || login == "" {
		respondError(w, http.StatusBadRequest, "name, email and login are required")
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
		claims.Sub,
	); err != nil {
		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}
	if loginInUse {
		respondError(w, http.StatusConflict, "login already in use")
		return
	}

	var updatedUser struct {
		ID      string `db:"id"`
		Name    string `db:"name"`
		Email   string `db:"email"`
		Login   string `db:"login"`
		Phone   string `db:"phone"`
		Address string `db:"address"`
		Avatar  string `db:"avatar"`
		Active  bool   `db:"active"`
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
		    updated = NOW()
		WHERE id = $8
		RETURNING id, name, email, login, COALESCE(phone, '') AS phone, COALESCE(address, '') AS address, COALESCE(avatar, '') AS avatar, ativo AS active
		`,
		name,
		email,
		login,
		password,
		phone,
		address,
		avatar,
		claims.Sub,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		var pgErr *pq.Error
		if errors.As(err, &pgErr) {
			if pgErr.Constraint == "users_email_key" {
				respondError(w, http.StatusConflict, "email already in use")
				return
			}
			if pgErr.Constraint == "users_login_key" || pgErr.Constraint == "users_login_lower_key" {
				respondError(w, http.StatusConflict, "login already in use")
				return
			}
			if pgErr.Code == "23505" {
				respondError(w, http.StatusConflict, "conflict")
				return
			}
		}

		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	token, expiresAt, err := h.tokenManager.Generate(updatedUser.ID, updatedUser.Login, updatedUser.Name, time.Now())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":     token,
		"tokenType": "Bearer",
		"expiresAt": expiresAt.UTC().Format(time.RFC3339),
		"user": map[string]interface{}{
			"id":      updatedUser.ID,
			"name":    updatedUser.Name,
			"email":   updatedUser.Email,
			"login":   updatedUser.Login,
			"phone":   updatedUser.Phone,
			"address": updatedUser.Address,
			"avatar":  updatedUser.Avatar,
			"active":  updatedUser.Active,
		},
	})
}

func normalizeAvatarInput(value string) (string, error) {
	avatar := strings.TrimSpace(value)
	if avatar == "" {
		return "", nil
	}

	avatarLower := strings.ToLower(avatar)
	if !strings.HasPrefix(avatarLower, "data:image/") {
		return "", errors.New("avatar must be an image data URL")
	}

	parts := strings.SplitN(avatar, ",", 2)
	if len(parts) != 2 {
		return "", errors.New("avatar image format is invalid")
	}

	meta := strings.ToLower(parts[0])
	if !strings.Contains(meta, ";base64") {
		return "", errors.New("avatar image format is invalid")
	}

	allowedMimes := []string{
		"data:image/png",
		"data:image/jpeg",
		"data:image/jpg",
		"data:image/webp",
		"data:image/gif",
	}

	isAllowedMime := false
	for _, allowedMime := range allowedMimes {
		if strings.HasPrefix(meta, allowedMime) {
			isAllowedMime = true
			break
		}
	}
	if !isAllowedMime {
		return "", errors.New("avatar image type is not supported")
	}

	encodedData := parts[1]
	decoded, err := base64.StdEncoding.DecodeString(encodedData)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(encodedData)
		if err != nil {
			return "", errors.New("avatar image is invalid")
		}
	}

	if len(decoded) > maxAvatarBytes {
		return "", errors.New("avatar image exceeds 1MB")
	}

	return avatar, nil
}

func (h *UserHandler) isUserAdministrator(ctx context.Context, userID string) (bool, error) {
	var isAdministrator bool
	if err := h.db.GetContext(
		ctx,
		&isAdministrator,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM user_profiles up
		  INNER JOIN profiles p ON p.id = up.profile_id
		  WHERE up.user_id = $1
		    AND (
		      p.id = 'profile_administrator'
		      OR LOWER(p.name) = LOWER('administrator')
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

func (h *UserHandler) authorizeRequest(r *http.Request) (auth.Claims, error) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return auth.Claims{}, errors.New("missing authorization header")
	}

	if len(authHeader) < 7 || !strings.EqualFold(authHeader[:7], "Bearer ") {
		return auth.Claims{}, errors.New("invalid authorization format")
	}

	token := strings.TrimSpace(authHeader[7:])
	if token == "" {
		return auth.Claims{}, errors.New("missing bearer token")
	}

	return h.tokenManager.ParseAndValidate(token, time.Now())
}

func (h *UserHandler) handleUsecaseError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		respondError(w, http.StatusBadRequest, "invalid input")
	case errors.Is(err, usecase.ErrNotFound):
		respondError(w, http.StatusNotFound, "user not found")
	default:
		respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
