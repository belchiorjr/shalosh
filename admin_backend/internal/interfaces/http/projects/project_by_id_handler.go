package projects

import (
	"encoding/json"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectByID(w http.ResponseWriter, r *http.Request, projectID string) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsRead); !ok {
			return
		}

		project, err := h.projectService.GetProjectDetail(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, project)
	case http.MethodPatch:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsUpdate); !ok {
			return
		}

		var payload struct {
			Name                  string    `json:"name"`
			Objective             string    `json:"objective"`
			ProjectTypeID         string    `json:"projectTypeId"`
			LifecycleType         string    `json:"lifecycleType"`
			HasMonthlyMaintenance *bool     `json:"hasMonthlyMaintenance"`
			StartDate             string    `json:"startDate"`
			EndDate               string    `json:"endDate"`
			Active                *bool     `json:"active"`
			ClientIDs             *[]string `json:"clientIds"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		startDate, err := parseOptionalDate(payload.StartDate)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid startDate")
			return
		}
		endDate, err := parseOptionalDate(payload.EndDate)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid endDate")
			return
		}

		hasMonthlyMaintenance := false
		if payload.HasMonthlyMaintenance != nil {
			hasMonthlyMaintenance = *payload.HasMonthlyMaintenance
		}

		project, err := h.projectService.UpdateProject(r.Context(), usecase.UpdateProjectInput{
			ID:                    projectID,
			Name:                  payload.Name,
			Objective:             payload.Objective,
			ProjectTypeID:         payload.ProjectTypeID,
			LifecycleType:         payload.LifecycleType,
			HasMonthlyMaintenance: hasMonthlyMaintenance,
			StartDate:             startDate,
			EndDate:               endDate,
			Active:                payload.Active,
			ClientIDs:             payload.ClientIDs,
		})
		if err != nil {
			h.handleProjectUsecaseError(w, err, "name is required")
			return
		}

		h.respondJSON(w, http.StatusOK, project)
	case http.MethodDelete:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsUpdate); !ok {
			return
		}

		if err := h.projectService.DeleteProject(r.Context(), projectID); err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
