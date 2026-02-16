package userprofiles

import "net/http"

func (h *Handler) HandleAuthMyProfiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	profiles, err := h.userProfileService.ListProfilesByUserID(r.Context(), claims.Sub)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	isAdministrator, err := h.isUserAdministrator(r.Context(), claims.Sub)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	profileIDs := make([]string, 0, len(profiles))
	for _, profile := range profiles {
		profileIDs = append(profileIDs, profile.ID)
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"userId":          claims.Sub,
		"isAdministrator": isAdministrator,
		"profileIds":      profileIDs,
		"profiles":        profiles,
	})
}
