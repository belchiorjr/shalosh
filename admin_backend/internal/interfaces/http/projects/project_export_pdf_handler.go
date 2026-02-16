package projects

import (
	"fmt"
	"net/http"
	"strings"

	"admin_backend/internal/usecase"
)

func (h *Handler) handleProjectExportPDF(
	w http.ResponseWriter,
	r *http.Request,
	projectID string,
) {
	switch r.Method {
	case http.MethodGet:
		if _, ok := h.authorizeWithPermission(w, r, permissionProjectsRead); !ok {
			return
		}

		pdfBytes, err := h.projectService.ExportProjectPDF(
			r.Context(),
			projectID,
			usecase.ProjectPDFStyle{
				Theme: r.URL.Query().Get("theme"),
				Font:  r.URL.Query().Get("font"),
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err, "")
			return
		}

		fileName := sanitizeProjectPDFFileName(projectID)
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", fileName))
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(pdfBytes)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func sanitizeProjectPDFFileName(projectID string) string {
	normalized := strings.TrimSpace(projectID)
	if normalized == "" {
		return "projeto.pdf"
	}

	builder := strings.Builder{}
	for _, char := range normalized {
		if (char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '-' ||
			char == '_' {
			builder.WriteRune(char)
			continue
		}
		builder.WriteRune('-')
	}

	trimmed := strings.Trim(builder.String(), "-")
	if trimmed == "" {
		return "projeto.pdf"
	}

	return fmt.Sprintf("projeto-%s.pdf", trimmed)
}
