package http

import (
	"net/http"

	"admin_backend/internal/infra/auth"
	authhttp "admin_backend/internal/interfaces/http/auth"
	clientportalhttp "admin_backend/internal/interfaces/http/clientportal"
	clientshttp "admin_backend/internal/interfaces/http/clients"
	projectshttp "admin_backend/internal/interfaces/http/projects"
	securityhttp "admin_backend/internal/interfaces/http/security"
	servicerequestshttp "admin_backend/internal/interfaces/http/servicerequests"
	userprofileshttp "admin_backend/internal/interfaces/http/userprofiles"
	usershttp "admin_backend/internal/interfaces/http/users"
	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
)

type UserHandler struct {
	service              *usecase.UserService
	clientService        *usecase.ClientService
	authService          *usecase.AuthService
	authorizationService *usecase.AuthorizationService
	userProfileService   *usecase.UserProfileService
	securityService      *usecase.SecurityService
	projectService       *usecase.ProjectService
	clientPortalService  *usecase.ClientPortalService
	db                   *sqlx.DB
	tokenManager         *auth.TokenManager

	authHandler            *authhttp.Handler
	clientPortalHandler    *clientportalhttp.Handler
	usersHandler           *usershttp.Handler
	userProfilesHandler    *userprofileshttp.Handler
	clientsHandler         *clientshttp.Handler
	securityHandler        *securityhttp.Handler
	projectsHandler        *projectshttp.Handler
	serviceRequestsHandler *servicerequestshttp.Handler
}

func NewUserHandler(
	service *usecase.UserService,
	clientService *usecase.ClientService,
	authService *usecase.AuthService,
	authorizationService *usecase.AuthorizationService,
	userProfileService *usecase.UserProfileService,
	securityService *usecase.SecurityService,
	projectService *usecase.ProjectService,
	clientPortalService *usecase.ClientPortalService,
	db *sqlx.DB,
	tokenManager *auth.TokenManager,
) *UserHandler {
	handler := &UserHandler{
		service:              service,
		clientService:        clientService,
		authService:          authService,
		authorizationService: authorizationService,
		userProfileService:   userProfileService,
		securityService:      securityService,
		projectService:       projectService,
		clientPortalService:  clientPortalService,
		db:                   db,
		tokenManager:         tokenManager,
	}

	handler.userProfilesHandler = userprofileshttp.NewHandler(
		handler.userProfileService,
		handler.authorizeRequest,
		handler.isUserAdministrator,
		respondJSON,
		respondError,
	)

	handler.authHandler = authhttp.NewHandler(
		handler.authService,
		handler.tokenManager,
		handler.authorizeRequest,
		normalizeAvatarInput,
		respondJSON,
		respondError,
	)

	handler.usersHandler = usershttp.NewHandler(
		handler.service,
		handler.db,
		handler.authorizeRequest,
		normalizeAvatarInput,
		handler.userProfilesHandler.HandleUserProfiles,
		respondJSON,
		respondError,
	)

	handler.clientsHandler = clientshttp.NewHandler(
		handler.clientService,
		handler.authorizeRequest,
		handler.hasUserPermission,
		normalizeAvatarInput,
		respondJSON,
		respondError,
	)

	handler.securityHandler = securityhttp.NewHandler(
		handler.securityService,
		handler.authorizeRequest,
		handler.isUserAdministrator,
		respondJSON,
		respondError,
	)

	handler.projectsHandler = projectshttp.NewHandler(
		handler.projectService,
		handler.authorizeRequest,
		handler.hasUserPermission,
		respondJSON,
		respondError,
	)

	handler.clientPortalHandler = clientportalhttp.NewHandler(
		handler.clientPortalService,
		handler.projectService,
		handler.tokenManager,
		normalizeAvatarInput,
		respondJSON,
		respondError,
	)

	handler.serviceRequestsHandler = servicerequestshttp.NewHandler(
		handler.clientPortalService,
		handler.authorizeRequest,
		respondJSON,
		respondError,
	)

	return handler
}

func (h *UserHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", h.handleHealth)
	mux.HandleFunc("/auth/login", h.authHandler.HandleLogin)
	mux.HandleFunc("/auth/account", h.authHandler.HandleAccount)
	mux.HandleFunc("/auth/me/profiles", h.userProfilesHandler.HandleAuthMyProfiles)
	mux.HandleFunc("/users", h.usersHandler.HandleUsers)
	mux.HandleFunc("/users/active", h.usersHandler.HandleActiveUsers)
	mux.HandleFunc("/users/", h.usersHandler.HandleUserByID)
	mux.HandleFunc("/clients", h.clientsHandler.HandleClients)
	mux.HandleFunc("/clients/active", h.clientsHandler.HandleActiveClients)
	mux.HandleFunc("/clients/", h.clientsHandler.HandleClientByID)
	mux.HandleFunc("/utils/cep/", h.clientsHandler.HandleCEPByZipCode)
	mux.HandleFunc("/permissions", h.securityHandler.HandlePermissions)
	mux.HandleFunc("/permissions/", h.securityHandler.HandlePermissionByID)
	mux.HandleFunc("/profiles", h.securityHandler.HandleProfiles)
	mux.HandleFunc("/profiles/", h.securityHandler.HandleProfileByID)
	mux.HandleFunc("/project-categories", h.projectsHandler.HandleProjectCategories)
	mux.HandleFunc("/project-types", h.projectsHandler.HandleProjectTypes)
	mux.HandleFunc("/project-types/", h.projectsHandler.HandleProjectTypeByID)
	mux.HandleFunc("/projects", h.projectsHandler.HandleProjects)
	mux.HandleFunc("/projects/", h.projectsHandler.HandleProjectRoutes)
	mux.HandleFunc("/client-auth/login", h.clientPortalHandler.HandleClientLogin)
	mux.HandleFunc("/client-auth/register", h.clientPortalHandler.HandleClientRegister)
	mux.HandleFunc("/client-auth/account", h.clientPortalHandler.HandleClientAccount)
	mux.HandleFunc("/client/dashboard", h.clientPortalHandler.HandleClientDashboard)
	mux.HandleFunc("/client/projects", h.clientPortalHandler.HandleClientProjects)
	mux.HandleFunc("/client/projects/", h.clientPortalHandler.HandleClientProjectRoutes)
	mux.HandleFunc("/client/payments", h.clientPortalHandler.HandleClientPayments)
	mux.HandleFunc("/client/service-requests", h.clientPortalHandler.HandleClientServiceRequests)
	mux.HandleFunc("/client/service-requests/", h.clientPortalHandler.HandleClientServiceRequests)
	mux.HandleFunc("/service-requests", h.serviceRequestsHandler.HandleServiceRequests)
	mux.HandleFunc("/service-requests/", h.serviceRequestsHandler.HandleServiceRequests)
}

func (h *UserHandler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
