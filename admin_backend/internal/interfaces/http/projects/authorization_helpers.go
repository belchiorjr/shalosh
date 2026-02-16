package projects

import (
	"net/http"

	"admin_backend/internal/infra/auth"
)

func (h *Handler) authorizeWithPermission(
	w http.ResponseWriter,
	r *http.Request,
	permissionCode string,
) (auth.Claims, bool) {
	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return auth.Claims{}, false
	}

	allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionCode)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return auth.Claims{}, false
	}
	if !allowed {
		h.respondError(w, http.StatusForbidden, "forbidden")
		return auth.Claims{}, false
	}

	return claims, true
}
