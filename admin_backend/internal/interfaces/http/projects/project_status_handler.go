package projects

import (
	"encoding/json"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectStatus(w http.ResponseWriter, r *http.Request, projectID string) {
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	if _, ok := h.authorizeWithPermission(w, r, permissionProjectsUpdate); !ok {
		return
	}

	var payload struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}
	if strings.TrimSpace(payload.Status) == "" {
		h.respondError(w, http.StatusBadRequest, "status is required")
		return
	}

	project, err := h.projectService.UpdateProjectStatus(
		r.Context(),
		usecase.UpdateProjectStatusInput{
			ID:     projectID,
			Status: payload.Status,
		},
	)
	if err != nil {
		h.handleProjectUsecaseError(w, err, "invalid project status")
		return
	}

	h.respondJSON(w, http.StatusOK, project)
}
