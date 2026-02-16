package projects

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleProjectTypes(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectTypesRead); !ok {
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

		projectTypes, err := h.projectService.ListProjectTypes(r.Context(), usecase.ProjectTypeListFilter{
			CategoryID: r.URL.Query().Get("categoryId"),
			OnlyActive: onlyActive,
		})
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, projectTypes)
	case http.MethodPost:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectTypesCreate); !ok {
			return
		}

		var payload struct {
			CategoryID  string `json:"categoryId"`
			Code        string `json:"code"`
			Name        string `json:"name"`
			Description string `json:"description"`
			Active      *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		active := true
		if payload.Active != nil {
			active = *payload.Active
		}

		projectType, err := h.projectService.CreateProjectType(
			r.Context(),
			usecase.CreateProjectTypeInput{
				CategoryID:  payload.CategoryID,
				Code:        payload.Code,
				Name:        payload.Name,
				Description: payload.Description,
				Active:      active,
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(
				w,
				err,
				"categoryId, code and name are required",
			)
			return
		}

		h.respondJSON(w, http.StatusCreated, projectType)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
