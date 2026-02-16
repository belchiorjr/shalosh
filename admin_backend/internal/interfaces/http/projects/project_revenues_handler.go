package projects

import (
	"encoding/json"
	"net/http"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectRevenues(w http.ResponseWriter, r *http.Request, projectID string) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectRevenuesRead); !ok {
			return
		}

		revenues, err := h.projectService.ListProjectRevenues(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, revenues)
	case http.MethodPost:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectRevenuesCreate); !ok {
			return
		}

		var payload struct {
			Title       string                  `json:"title"`
			Description string                  `json:"description"`
			Objective   string                  `json:"objective"`
			Amount      float64                 `json:"amount"`
			ExpectedOn  string                  `json:"expectedOn"`
			ReceivedOn  string                  `json:"receivedOn"`
			Status      string                  `json:"status"`
			Active      *bool                   `json:"active"`
			Receipts    []revenueReceiptPayload `json:"receipts"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		expectedOn, err := parseOptionalDate(payload.ExpectedOn)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid expectedOn")
			return
		}
		receivedOn, err := parseOptionalDate(payload.ReceivedOn)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid receivedOn")
			return
		}
		receipts, err := mapRevenueReceiptPayloads(payload.Receipts)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid receipt issuedOn")
			return
		}

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		revenue, err := h.projectService.CreateProjectRevenue(
			r.Context(),
			usecase.CreateProjectRevenueInput{
				ProjectID:   projectID,
				Title:       payload.Title,
				Description: payload.Description,
				Objective:   payload.Objective,
				Amount:      payload.Amount,
				ExpectedOn:  expectedOn,
				ReceivedOn:  receivedOn,
				Status:      payload.Status,
				Active:      active,
				Receipts:    receipts,
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "title is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, revenue)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
