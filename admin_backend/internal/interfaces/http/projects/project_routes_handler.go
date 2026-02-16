package projects

import (
	"net/http"
	"strings"
)

func (h *Handler) HandleProjectRoutes(w http.ResponseWriter, r *http.Request) {
	trimmedPath := strings.TrimPrefix(r.URL.Path, "/projects/")
	trimmedPath = strings.Trim(trimmedPath, "/")
	if trimmedPath == "" {
		h.respondError(w, http.StatusNotFound, "project not found")
		return
	}

	segments := strings.Split(trimmedPath, "/")
	projectID := strings.TrimSpace(segments[0])
	if projectID == "" {
		h.respondError(w, http.StatusNotFound, "project not found")
		return
	}

	if len(segments) == 1 {
		h.handleProjectByID(w, r, projectID)
		return
	}

	if len(segments) == 3 {
		resource := strings.ToLower(strings.TrimSpace(segments[1]))
		resourceID := strings.TrimSpace(segments[2])
		if resourceID == "" {
			h.respondError(w, http.StatusNotFound, "route not found")
			return
		}

		switch resource {
		case "tasks":
			h.handleProjectTaskByID(w, r, projectID, resourceID)
		case "phases":
			h.handleProjectPhaseByID(w, r, projectID, resourceID)
		default:
			h.respondError(w, http.StatusNotFound, "route not found")
		}
		return
	}

	if len(segments) > 3 {
		h.respondError(w, http.StatusNotFound, "route not found")
		return
	}

	switch strings.ToLower(strings.TrimSpace(segments[1])) {
	case "export":
		h.handleProjectExport(w, r, projectID)
	case "export-pdf":
		h.handleProjectExportPDF(w, r, projectID)
	case "recalculate":
		h.handleProjectRecalculate(w, r, projectID)
	case "revenues":
		h.handleProjectRevenues(w, r, projectID)
	case "monthly-charges":
		h.handleProjectMonthlyCharges(w, r, projectID)
	case "phases":
		h.handleProjectPhases(w, r, projectID)
	case "tasks":
		h.handleProjectTasks(w, r, projectID)
	default:
		h.respondError(w, http.StatusNotFound, "route not found")
	}
}
