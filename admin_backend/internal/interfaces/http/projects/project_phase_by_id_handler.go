package projects

import (
	"encoding/json"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectPhaseByID(
	w http.ResponseWriter,
	r *http.Request,
	projectID string,
	phaseID string,
) {
	switch r.Method {
	case http.MethodPatch:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsUpdate); !ok {
			return
		}

		var payload struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Objective   string `json:"objective"`
			StartsOn    string `json:"startsOn"`
			EndsOn      string `json:"endsOn"`
			Position    int    `json:"position"`
			Active      *bool  `json:"active"`
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

		phase, err := h.projectService.UpdateProjectPhase(
			r.Context(),
			usecase.UpdateProjectPhaseInput{
				ID:          phaseID,
				ProjectID:   projectID,
				Name:        payload.Name,
				Description: payload.Description,
				Objective:   payload.Objective,
				StartsOn:    startsOn,
				EndsOn:      endsOn,
				Position:    payload.Position,
				Active:      active,
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "name is required")
			return
		}

		h.respondJSON(w, http.StatusOK, phase)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
