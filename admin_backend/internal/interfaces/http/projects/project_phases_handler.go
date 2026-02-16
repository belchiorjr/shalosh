package projects

import (
	"encoding/json"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectPhases(w http.ResponseWriter, r *http.Request, projectID string) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectPhasesRead); !ok {
			return
		}

		phases, err := h.projectService.ListProjectPhases(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, phases)
	case http.MethodPost:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectPhasesCreate); !ok {
			return
		}

		var payload struct {
			Name        string               `json:"name"`
			Description string               `json:"description"`
			Objective   string               `json:"objective"`
			StartsOn    string               `json:"startsOn"`
			EndsOn      string               `json:"endsOn"`
			Position    int                  `json:"position"`
			Active      *bool                `json:"active"`
			Files       []relatedFilePayload `json:"files"`
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

		phase, err := h.projectService.CreateProjectPhase(
			r.Context(),
			usecase.CreateProjectPhaseInput{
				ProjectID:   projectID,
				Name:        payload.Name,
				Description: payload.Description,
				Objective:   payload.Objective,
				StartsOn:    startsOn,
				EndsOn:      endsOn,
				Position:    payload.Position,
				Active:      active,
				Files:       mapRelatedFilePayloads(payload.Files),
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "name is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, phase)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
