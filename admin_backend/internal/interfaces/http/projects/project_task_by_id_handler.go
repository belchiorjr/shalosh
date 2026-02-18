package projects

import (
	"encoding/json"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectTaskByID(
	w http.ResponseWriter,
	r *http.Request,
	projectID string,
	taskID string,
) {
	switch r.Method {
	case http.MethodPatch:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectTasksUpdate); !ok {
			return
		}

		var payload struct {
			ProjectPhaseID    string `json:"projectPhaseId"`
			ResponsibleUserID string `json:"responsibleUserId"`
			Name              string `json:"name"`
			Description       string `json:"description"`
			Objective         string `json:"objective"`
			StartsOn          string `json:"startsOn"`
			EndsOn            string `json:"endsOn"`
			Position          int    `json:"position"`
			Status            string `json:"status"`
			Active            *bool  `json:"active"`
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

		task, err := h.projectService.UpdateProjectTask(
			r.Context(),
			usecase.UpdateProjectTaskInput{
				ID:                taskID,
				ProjectID:         projectID,
				ProjectPhaseID:    payload.ProjectPhaseID,
				ResponsibleUserID: payload.ResponsibleUserID,
				Name:              payload.Name,
				Description:       payload.Description,
				Objective:         payload.Objective,
				StartsOn:          startsOn,
				EndsOn:            endsOn,
				Position:          payload.Position,
				Status:            payload.Status,
				Active:            active,
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "name is required")
			return
		}

		h.respondJSON(w, http.StatusOK, task)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
