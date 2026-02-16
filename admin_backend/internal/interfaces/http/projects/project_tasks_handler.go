package projects

import (
	"encoding/json"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectTasks(w http.ResponseWriter, r *http.Request, projectID string) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectTasksRead); !ok {
			return
		}

		tasks, err := h.projectService.ListProjectTasks(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, tasks)
	case http.MethodPost:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectTasksCreate); !ok {
			return
		}

		var payload struct {
			ProjectPhaseID string               `json:"projectPhaseId"`
			Name           string               `json:"name"`
			Description    string               `json:"description"`
			Objective      string               `json:"objective"`
			StartsOn       string               `json:"startsOn"`
			EndsOn         string               `json:"endsOn"`
			Position       int                  `json:"position"`
			Status         string               `json:"status"`
			Active         *bool                `json:"active"`
			Files          []relatedFilePayload `json:"files"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		startsOn, err := parseOptionalDate(payload.StartsOn)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid startsOn")
			return
		}
		endsOn, err := parseOptionalDate(payload.EndsOn)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid endsOn")
			return
		}

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		task, err := h.projectService.CreateProjectTask(
			r.Context(),
			usecase.CreateProjectTaskInput{
				ProjectID:      projectID,
				ProjectPhaseID: payload.ProjectPhaseID,
				Name:           payload.Name,
				Description:    payload.Description,
				Objective:      payload.Objective,
				StartsOn:       startsOn,
				EndsOn:         endsOn,
				Position:       payload.Position,
				Status:         payload.Status,
				Active:         active,
				Files:          mapRelatedFilePayloads(payload.Files),
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "name is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, task)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
