package projects

import (
	"encoding/json"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectTaskComments(
	w http.ResponseWriter,
	r *http.Request,
	projectID string,
	taskID string,
) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectTasksRead); !ok {
			return
		}

		comments, err := h.projectService.ListProjectTaskComments(r.Context(), projectID, taskID)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, comments)
	case http.MethodPost:
		claims, ok := h.authorizeWithPermission(w, r, permissionProjectTasksCreate)
		if !ok {
			return
		}

		var payload struct {
			ParentCommentID string               `json:"parentCommentId"`
			Comment         string               `json:"comment"`
			Files           []relatedFilePayload `json:"files"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		if strings.TrimSpace(payload.Comment) == "" {
			h.respondError(w, http.StatusBadRequest, "comment is required")
			return
		}

		comment, err := h.projectService.CreateProjectTaskComment(
			r.Context(),
			usecase.CreateProjectTaskCommentInput{
				ProjectID:       projectID,
				ProjectTaskID:   taskID,
				ParentCommentID: payload.ParentCommentID,
				AuthorUserID:    claims.Sub,
				Comment:         payload.Comment,
				Files:           mapRelatedFilePayloads(payload.Files),
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "comment is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, comment)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
