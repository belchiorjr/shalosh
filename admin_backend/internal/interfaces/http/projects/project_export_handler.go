package projects

import "net/http"

func (h *Handler) handleProjectExport(w http.ResponseWriter, r *http.Request, projectID string) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsRead); !ok {
			return
		}

		exportPayload, err := h.projectService.ExportProject(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, exportPayload)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
