package projects

import "net/http"

func (h *Handler) handleProjectRecalculate(w http.ResponseWriter, r *http.Request, projectID string) {
	switch r.Method {
	case http.MethodPost:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsUpdate); !ok {
			return
		}

		project, err := h.projectService.RecalculateProjectTimeline(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, project)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
