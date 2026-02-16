package projects

import "net/http"

func (h *Handler) HandleProjectCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	if _, ok := h.authorizeWithPermission(w, r, permissionProjectCategoriesRead); !ok {
		return
	}

	categories, err := h.projectService.ListProjectCategories(r.Context())
	if err != nil {
		h.handleProjectUsecaseError(w, err, "")
		return
	}

	h.respondJSON(w, http.StatusOK, categories)
}
