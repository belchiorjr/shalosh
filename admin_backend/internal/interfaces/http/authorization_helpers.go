package http

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"admin_backend/internal/infra/auth"
)

func (h *UserHandler) isUserAdministrator(ctx context.Context, userID string) (bool, error) {
	return h.authorizationService.IsUserAdministrator(ctx, userID)
}

func (h *UserHandler) hasUserPermission(ctx context.Context, userID, permissionCode string) (bool, error) {
	return h.authorizationService.HasUserPermission(ctx, userID, permissionCode)
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
