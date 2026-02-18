package projects

import (
	"encoding/json"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectRevenueByID(
	w http.ResponseWriter,
	r *http.Request,
	projectID string,
	revenueID string,
) {
	switch r.Method {
	case http.MethodPatch:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectRevenuesUpdate); !ok {
			return
		}

		var payload struct {
			Status *string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}
		if payload.Status == nil || strings.TrimSpace(*payload.Status) == "" {
			h.respondError(w, http.StatusBadRequest, "status is required")
			return
		}

		if err := h.projectService.UpdateProjectRevenueStatus(
			r.Context(),
			usecase.UpdateProjectRevenueStatusInput{
				ID:        revenueID,
				ProjectID: projectID,
				Status:    *payload.Status,
			},
		); err != nil {
			h.handleProjectUsecaseError(w, err, "invalid revenue status")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
