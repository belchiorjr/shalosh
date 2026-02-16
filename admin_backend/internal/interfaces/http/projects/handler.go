package projects

import (
	"context"
	"net/http"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

type Handler struct {
	projectService    *usecase.ProjectService
	authorizeRequest  func(r *http.Request) (infraauth.Claims, error)
	hasUserPermission func(ctx context.Context, userID, permissionCode string) (bool, error)
	respondJSON       func(w http.ResponseWriter, status int, payload interface{})
	respondError      func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	projectService *usecase.ProjectService,
	authorizeRequest func(r *http.Request) (infraauth.Claims, error),
	hasUserPermission func(ctx context.Context, userID, permissionCode string) (bool, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		projectService:    projectService,
		authorizeRequest:  authorizeRequest,
		hasUserPermission: hasUserPermission,
		respondJSON:       respondJSON,
		respondError:      respondError,
	}
}

const (
	permissionProjectCategoriesRead = "project_categories.read"

	permissionProjectTypesRead   = "project_types.read"
	permissionProjectTypesCreate = "project_types.create"
	permissionProjectTypesUpdate = "project_types.update"

	permissionProjectsRead   = "projects.read"
	permissionProjectsCreate = "projects.create"
	permissionProjectsUpdate = "projects.update"

	permissionProjectRevenuesRead   = "project_revenues.read"
	permissionProjectRevenuesCreate = "project_revenues.create"

	permissionProjectMonthlyChargesRead   = "project_monthly_charges.read"
	permissionProjectMonthlyChargesCreate = "project_monthly_charges.create"

	permissionProjectPhasesRead   = "project_phases.read"
	permissionProjectPhasesCreate = "project_phases.create"

	permissionProjectTasksRead   = "project_tasks.read"
	permissionProjectTasksCreate = "project_tasks.create"
	permissionProjectTasksUpdate = "project_tasks.update"
)
