package projects

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleProjects(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsRead); !ok {
			return
		}

		onlyActive := false
		if rawOnlyActive := strings.TrimSpace(r.URL.Query().Get("onlyActive")); rawOnlyActive != "" {
			parsedOnlyActive, err := strconv.ParseBool(rawOnlyActive)
			if err != nil {
				h.respondError(w, http.StatusBadRequest, "invalid onlyActive query param")
				return
			}
			onlyActive = parsedOnlyActive
		}

		projects, err := h.projectService.ListProjects(r.Context(), usecase.ProjectListFilter{
			Search:     r.URL.Query().Get("search"),
			OnlyActive: onlyActive,
		})
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, projects)
	case http.MethodPost:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsCreate); !ok {
			return
		}

		var payload struct {
			Name                  string   `json:"name"`
			Objective             string   `json:"objective"`
			ProjectTypeID         string   `json:"projectTypeId"`
			LifecycleType         string   `json:"lifecycleType"`
			HasMonthlyMaintenance *bool    `json:"hasMonthlyMaintenance"`
			StartDate             string   `json:"startDate"`
			EndDate               string   `json:"endDate"`
			Active                *bool    `json:"active"`
			ClientIDs             []string `json:"clientIds"`
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

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}
		hasMonthlyMaintenance := false
		if payload.HasMonthlyMaintenance != nil {
			hasMonthlyMaintenance = *payload.HasMonthlyMaintenance
		}

		project, err := h.projectService.CreateProject(r.Context(), usecase.CreateProjectInput{
			Name:                  payload.Name,
			Objective:             payload.Objective,
			ProjectTypeID:         payload.ProjectTypeID,
			LifecycleType:         payload.LifecycleType,
			HasMonthlyMaintenance: hasMonthlyMaintenance,
			StartDate:             startDate,
			EndDate:               endDate,
			Active:                active,
			ClientIDs:             payload.ClientIDs,
		})
		if err != nil {
			h.handleProjectUsecaseError(w, err, "name is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, project)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
