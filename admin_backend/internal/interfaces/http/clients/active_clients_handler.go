package clients

import "net/http"

func (h *Handler) HandleActiveClients(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	allowed, err := h.hasUserPermission(r.Context(), claims.Sub, permissionClientsRead)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}
	if !allowed {
		h.respondError(w, http.StatusForbidden, "forbidden")
		return
	}

	clients, err := h.clientService.List(r.Context(), true)
	if err != nil {
		h.handleClientUsecaseError(w, err)
		return
	}

	h.respondJSON(w, http.StatusOK, clients)
}
