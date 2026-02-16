package projects

import (
	"encoding/json"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectMonthlyCharges(
	w http.ResponseWriter,
	r *http.Request,
	projectID string,
) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectMonthlyChargesRead); !ok {
			return
		}

		charges, err := h.projectService.ListProjectMonthlyCharges(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, charges)
	case http.MethodPost:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectMonthlyChargesCreate); !ok {
			return
		}

		var payload struct {
			Title       string  `json:"title"`
			Description string  `json:"description"`
			Amount      float64 `json:"amount"`
			DueDay      int     `json:"dueDay"`
			StartsOn    string  `json:"startsOn"`
			EndsOn      string  `json:"endsOn"`
			Active      *bool   `json:"active"`
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

		charge, err := h.projectService.CreateProjectMonthlyCharge(
			r.Context(),
			usecase.CreateProjectMonthlyChargeInput{
				ProjectID:   projectID,
				Title:       payload.Title,
				Description: payload.Description,
				Amount:      payload.Amount,
				DueDay:      payload.DueDay,
				StartsOn:    startsOn,
				EndsOn:      endsOn,
				Active:      active,
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "title is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, charge)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
