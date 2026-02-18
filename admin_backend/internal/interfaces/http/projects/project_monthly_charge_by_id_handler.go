package projects

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectMonthlyChargeByID(
	w http.ResponseWriter,
	r *http.Request,
	projectID string,
	monthlyChargeID string,
) {
	switch r.Method {
	case http.MethodPatch:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectMonthlyChargesUpdate); !ok {
			return
		}

		var payload struct {
			Title       *string  `json:"title"`
			Description *string  `json:"description"`
			Installment *string  `json:"installment"`
			Status      *string  `json:"status"`
			Amount      *float64 `json:"amount"`
			DueDay      *int     `json:"dueDay"`
			StartsOn    *string  `json:"startsOn"`
			EndsOn      *string  `json:"endsOn"`
			Active      *bool    `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		isAmountOnlyUpdate := payload.Title == nil &&
			payload.Description == nil &&
			payload.Installment == nil &&
			payload.Status == nil &&
			payload.DueDay == nil &&
			payload.StartsOn == nil &&
			payload.EndsOn == nil &&
			payload.Active == nil

		if isAmountOnlyUpdate {
			if payload.Amount == nil {
				h.respondError(w, http.StatusBadRequest, "amount is required")
				return
			}
			if *payload.Amount < 0 {
				h.respondError(w, http.StatusBadRequest, "amount must be greater than or equal to 0")
				return
			}

			charge, err := h.projectService.UpdateProjectMonthlyChargeAmount(
				r.Context(),
				usecase.UpdateProjectMonthlyChargeAmountInput{
					ID:        monthlyChargeID,
					ProjectID: projectID,
					Amount:    *payload.Amount,
				},
			)
			if err != nil {
				if errors.Is(err, usecase.ErrConflict) {
					h.respondError(w, http.StatusConflict, "paid or cancelled monthly charges cannot be edited")
					return
				}
				h.handleProjectUsecaseError(w, err, "invalid monthly charge input")
				return
			}

			h.respondJSON(w, http.StatusOK, charge)
			return
		}

		isStatusOnlyUpdate := payload.Status != nil &&
			payload.Title == nil &&
			payload.Description == nil &&
			payload.Installment == nil &&
			payload.Amount == nil &&
			payload.DueDay == nil &&
			payload.StartsOn == nil &&
			payload.EndsOn == nil &&
			payload.Active == nil
		if isStatusOnlyUpdate {
			charge, err := h.projectService.UpdateProjectMonthlyChargeStatus(
				r.Context(),
				usecase.UpdateProjectMonthlyChargeStatusInput{
					ID:        monthlyChargeID,
					ProjectID: projectID,
					Status:    *payload.Status,
				},
			)
			if err != nil {
				if errors.Is(err, usecase.ErrConflict) {
					h.respondError(w, http.StatusConflict, "paid or cancelled monthly charges cannot be edited")
					return
				}
				h.handleProjectUsecaseError(w, err, "invalid monthly charge input")
				return
			}

			h.respondJSON(w, http.StatusOK, charge)
			return
		}

		if payload.Title == nil || payload.Status == nil || payload.Amount == nil || payload.DueDay == nil {
			h.respondError(w, http.StatusBadRequest, "title, status, amount and dueDay are required")
			return
		}
		if strings.TrimSpace(*payload.Title) == "" {
			h.respondError(w, http.StatusBadRequest, "title is required")
			return
		}
		if *payload.Amount < 0 {
			h.respondError(w, http.StatusBadRequest, "amount must be greater than or equal to 0")
			return
		}
		if *payload.DueDay < 1 || *payload.DueDay > 31 {
			h.respondError(w, http.StatusBadRequest, "dueDay must be between 1 and 31")
			return
		}

		startsOnValue := ""
		if payload.StartsOn != nil {
			startsOnValue = *payload.StartsOn
		}
		startsOn, err := parseOptionalDate(startsOnValue)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid startsOn")
			return
		}

		endsOnValue := ""
		if payload.EndsOn != nil {
			endsOnValue = *payload.EndsOn
		}
		endsOn, err := parseOptionalDate(endsOnValue)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid endsOn")
			return
		}
		if startsOn != nil && endsOn != nil && endsOn.Before(*startsOn) {
			h.respondError(w, http.StatusBadRequest, "endsOn must be on or after startsOn")
			return
		}

		description := ""
		if payload.Description != nil {
			description = *payload.Description
		}

		installment := ""
		if payload.Installment != nil {
			installment = *payload.Installment
		}

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		charge, err := h.projectService.UpdateProjectMonthlyCharge(
			r.Context(),
			usecase.UpdateProjectMonthlyChargeInput{
				ID:          monthlyChargeID,
				ProjectID:   projectID,
				Title:       *payload.Title,
				Description: description,
				Installment: installment,
				Status:      *payload.Status,
				Amount:      *payload.Amount,
				DueDay:      *payload.DueDay,
				StartsOn:    startsOn,
				EndsOn:      endsOn,
				Active:      active,
			},
		)
		if err != nil {
			if errors.Is(err, usecase.ErrConflict) {
				h.respondError(w, http.StatusConflict, "paid or cancelled monthly charges cannot be edited")
				return
			}
			h.handleProjectUsecaseError(w, err, "invalid monthly charge input")
			return
		}

		h.respondJSON(w, http.StatusOK, charge)
	case http.MethodDelete:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectMonthlyChargesUpdate); !ok {
			return
		}

		if err := h.projectService.DeleteProjectMonthlyCharge(r.Context(), projectID, monthlyChargeID); err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
