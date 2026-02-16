package projects

import (
	"encoding/json"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) HandleProjectTypeByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	trimmedPath := strings.TrimPrefix(r.URL.Path, "/project-types/")
	if trimmedPath == "" || strings.Contains(trimmedPath, "/") {
		h.respondError(w, http.StatusNotFound, "project type not found")
		return
	}

	projectTypeID := strings.TrimSpace(trimmedPath)
	if projectTypeID == "" {
		h.respondError(w, http.StatusNotFound, "project type not found")
		return
	}

	if _, ok := h.authorizeWithPermission(w, r, permissionProjectTypesUpdate); !ok {
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

	projectType, err := h.projectService.UpdateProjectType(
		r.Context(),
		usecase.UpdateProjectTypeInput{
			ID:          projectTypeID,
			CategoryID:  payload.CategoryID,
			Code:        payload.Code,
			Name:        payload.Name,
			Description: payload.Description,
			Active:      payload.Active,
		},
	)
	if err != nil {
		h.handleProjectUsecaseError(w, err, "categoryId, code and name are required")
		return
	}

	h.respondJSON(w, http.StatusOK, projectType)
}
