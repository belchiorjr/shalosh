package clientportal

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sort"
	"strings"
	"time"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

type Handler struct {
	clientPortalService  *usecase.ClientPortalService
	projectService       *usecase.ProjectService
	tokenManager         *infraauth.TokenManager
	normalizeAvatarInput func(value string) (string, error)
	respondJSON          func(w http.ResponseWriter, status int, payload interface{})
	respondError         func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	clientPortalService *usecase.ClientPortalService,
	projectService *usecase.ProjectService,
	tokenManager *infraauth.TokenManager,
	normalizeAvatarInput func(value string) (string, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		clientPortalService:  clientPortalService,
		projectService:       projectService,
		tokenManager:         tokenManager,
		normalizeAvatarInput: normalizeAvatarInput,
		respondJSON:          respondJSON,
		respondError:         respondError,
	}
}

type relatedFilePayload struct {
	FileName    string `json:"fileName"`
	FileKey     string `json:"fileKey"`
	ContentType string `json:"contentType"`
	Notes       string `json:"notes"`
}

func (h *Handler) HandleClientLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	client, err := h.clientPortalService.Authenticate(
		r.Context(),
		payload.Login,
		payload.Password,
	)
	if err != nil {
		h.handlePortalUsecaseError(w, err, "login and password are required")
		return
	}

	token, expiresAt, err := h.tokenManager.Generate(
		client.ID,
		client.Login,
		client.Name,
		time.Now(),
	)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":     token,
		"tokenType": "Bearer",
		"expiresAt": expiresAt.UTC().Format(time.RFC3339),
		"client": map[string]interface{}{
			"id":     client.ID,
			"name":   client.Name,
			"email":  client.Email,
			"login":  client.Login,
			"avatar": client.Avatar,
			"active": client.Active,
		},
	})
}

func (h *Handler) HandleClientRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Login    string `json:"login"`
		Password string `json:"password"`
		Name     string `json:"name"`
		Email    string `json:"email"`
		Avatar   string `json:"avatar"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	avatar, err := h.normalizeAvatarInput(payload.Avatar)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	account, err := h.clientPortalService.Register(
		r.Context(),
		usecase.CreateClientPortalAccountInput{
			Login:    payload.Login,
			Password: payload.Password,
			Name:     payload.Name,
			Email:    payload.Email,
			Avatar:   avatar,
		},
	)
	if err != nil {
		h.handlePortalUsecaseError(w, err, "login and password are required")
		return
	}

	token, expiresAt, err := h.tokenManager.Generate(
		account.ID,
		account.Login,
		account.Name,
		time.Now(),
	)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	h.respondJSON(w, http.StatusCreated, map[string]interface{}{
		"token":     token,
		"tokenType": "Bearer",
		"expiresAt": expiresAt.UTC().Format(time.RFC3339),
		"client":    account,
	})
}

func (h *Handler) HandleClientAccount(w http.ResponseWriter, r *http.Request) {
	client, ok := h.authorizeClient(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		account, err := h.clientPortalService.GetAccount(r.Context(), client.ID)
		if err != nil {
			h.handlePortalUsecaseError(w, err, "")
			return
		}
		h.respondJSON(w, http.StatusOK, account)
	case http.MethodPatch:
		var payload struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Login    string `json:"login"`
			Password string `json:"password"`
			Avatar   string `json:"avatar"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		avatar, err := h.normalizeAvatarInput(payload.Avatar)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		account, err := h.clientPortalService.UpdateAccount(
			r.Context(),
			usecase.UpdateClientPortalAccountInput{
				ClientID: client.ID,
				Name:     payload.Name,
				Email:    payload.Email,
				Login:    payload.Login,
				Password: payload.Password,
				Avatar:   avatar,
			},
		)
		if err != nil {
			h.handlePortalUsecaseError(w, err, "name, email and login are required")
			return
		}

		token, expiresAt, err := h.tokenManager.Generate(
			account.ID,
			account.Login,
			account.Name,
			time.Now(),
		)
		if err != nil {
			h.respondError(w, http.StatusInternalServerError, "unexpected error")
			return
		}

		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"token":     token,
			"tokenType": "Bearer",
			"expiresAt": expiresAt.UTC().Format(time.RFC3339),
			"client":    account,
		})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *Handler) HandleClientDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	client, ok := h.authorizeClient(w, r)
	if !ok {
		return
	}

	projects, err := h.clientPortalService.ListProjects(r.Context(), client.ID)
	if err != nil {
		h.handlePortalUsecaseError(w, err, "")
		return
	}

	openRequests, err := h.clientPortalService.CountOpenRequests(r.Context(), client.ID)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return
	}

	type totals struct {
		TotalRevenueAmount   float64 `json:"totalRevenueAmount"`
		TotalRevenueReceived float64 `json:"totalRevenueReceived"`
		TotalChargeAmount    float64 `json:"totalChargeAmount"`
		TotalChargePaid      float64 `json:"totalChargePaid"`
	}

	financialTotals := totals{}
	for _, project := range projects {
		detail, detailErr := h.projectService.GetProjectDetail(r.Context(), project.ID)
		if detailErr != nil {
			continue
		}

		for _, revenue := range detail.Revenues {
			amount := sanitizeAmount(revenue.Amount)
			financialTotals.TotalRevenueAmount += amount
			if normalizeRevenueStatus(revenue.Status) == "recebido" {
				financialTotals.TotalRevenueReceived += amount
			}
		}

		for _, charge := range detail.MonthlyCharges {
			amount := sanitizeAmount(charge.Amount)
			financialTotals.TotalChargeAmount += amount
			if normalizeChargeStatus(charge.Status) == "pago" {
				financialTotals.TotalChargePaid += amount
			}
		}
	}

	statusTotals := map[string]int{
		"planejamento": 0,
		"andamento":    0,
		"concluido":    0,
		"cancelado":    0,
	}

	for _, project := range projects {
		statusTotals[normalizeProjectStatus(project.Status)] += 1
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"client": map[string]interface{}{
			"id":     client.ID,
			"name":   client.Name,
			"email":  client.Email,
			"login":  client.Login,
			"avatar": client.Avatar,
		},
		"summary": map[string]interface{}{
			"totalProjects":        len(projects),
			"planningProjects":     statusTotals["planejamento"],
			"inProgressProjects":   statusTotals["andamento"],
			"completedProjects":    statusTotals["concluido"],
			"cancelledProjects":    statusTotals["cancelado"],
			"openServiceRequests":  openRequests,
			"totalRevenueAmount":   financialTotals.TotalRevenueAmount,
			"totalRevenueReceived": financialTotals.TotalRevenueReceived,
			"totalChargeAmount":    financialTotals.TotalChargeAmount,
			"totalChargePaid":      financialTotals.TotalChargePaid,
			"totalChargePending":   financialTotals.TotalChargeAmount - financialTotals.TotalChargePaid,
		},
		"projects": projects,
	})
}

func (h *Handler) HandleClientProjects(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	client, ok := h.authorizeClient(w, r)
	if !ok {
		return
	}

	projects, err := h.clientPortalService.ListProjects(r.Context(), client.ID)
	if err != nil {
		h.handlePortalUsecaseError(w, err, "")
		return
	}

	h.respondJSON(w, http.StatusOK, projects)
}

func (h *Handler) HandleClientProjectRoutes(w http.ResponseWriter, r *http.Request) {
	client, ok := h.authorizeClient(w, r)
	if !ok {
		return
	}

	trimmedPath := strings.TrimPrefix(r.URL.Path, "/client/projects/")
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

	hasAccess, err := h.clientPortalService.HasProjectAccess(r.Context(), client.ID, projectID)
	if err != nil {
		h.handlePortalUsecaseError(w, err, "")
		return
	}
	if !hasAccess {
		h.respondError(w, http.StatusForbidden, "forbidden")
		return
	}

	if len(segments) == 1 {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		project, err := h.projectService.GetProjectDetail(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusOK, project)
		return
	}

	if len(segments) == 2 && strings.EqualFold(strings.TrimSpace(segments[1]), "planning") {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		exportPayload, err := h.projectService.ExportProject(r.Context(), projectID)
		if err != nil {
			h.handleProjectUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusOK, exportPayload)
		return
	}

	if len(segments) == 4 &&
		strings.EqualFold(strings.TrimSpace(segments[1]), "tasks") &&
		strings.EqualFold(strings.TrimSpace(segments[3]), "comments") {
		taskID := strings.TrimSpace(segments[2])
		if taskID == "" {
			h.respondError(w, http.StatusNotFound, "task not found")
			return
		}

		h.handleClientTaskComments(w, r, client.ID, projectID, taskID)
		return
	}

	h.respondError(w, http.StatusNotFound, "route not found")
}

func (h *Handler) handleClientTaskComments(
	w http.ResponseWriter,
	r *http.Request,
	clientID string,
	projectID string,
	taskID string,
) {
	switch r.Method {
	case http.MethodGet:
		comments, err := h.projectService.ListProjectTaskComments(r.Context(), projectID, taskID)
		if err != nil {
			h.handleProjectUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusOK, comments)
	case http.MethodPost:
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
				AuthorClientID:  clientID,
				Comment:         payload.Comment,
				Files:           mapRelatedFilePayloads(payload.Files),
			},
		)
		if err != nil {
			h.handleProjectUsecaseError(w, err)
			return
		}

		h.respondJSON(w, http.StatusCreated, comment)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *Handler) HandleClientPayments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	client, ok := h.authorizeClient(w, r)
	if !ok {
		return
	}

	projects, err := h.clientPortalService.ListProjects(r.Context(), client.ID)
	if err != nil {
		h.handlePortalUsecaseError(w, err, "")
		return
	}

	type projectPaymentRow struct {
		ProjectID      string                         `json:"projectId"`
		ProjectName    string                         `json:"projectName"`
		ProjectStatus  string                         `json:"projectStatus"`
		Revenues       []usecase.ProjectRevenue       `json:"revenues"`
		MonthlyCharges []usecase.ProjectMonthlyCharge `json:"monthlyCharges"`
	}

	rows := make([]projectPaymentRow, 0, len(projects))
	totalRevenue := 0.0
	totalRevenueReceived := 0.0
	totalCharges := 0.0
	totalChargesPaid := 0.0

	for _, project := range projects {
		detail, detailErr := h.projectService.GetProjectDetail(r.Context(), project.ID)
		if detailErr != nil {
			continue
		}

		revenues := append([]usecase.ProjectRevenue(nil), detail.Revenues...)
		sort.Slice(revenues, func(i, j int) bool {
			leftDate := pickRevenueDate(revenues[i])
			rightDate := pickRevenueDate(revenues[j])
			if leftDate.Equal(rightDate) {
				return revenues[i].ID < revenues[j].ID
			}
			return leftDate.After(rightDate)
		})

		charges := append([]usecase.ProjectMonthlyCharge(nil), detail.MonthlyCharges...)
		sort.Slice(charges, func(i, j int) bool {
			if charges[i].Updated.Equal(charges[j].Updated) {
				return charges[i].ID < charges[j].ID
			}
			return charges[i].Updated.After(charges[j].Updated)
		})

		for _, revenue := range revenues {
			amount := sanitizeAmount(revenue.Amount)
			totalRevenue += amount
			if normalizeRevenueStatus(revenue.Status) == "recebido" {
				totalRevenueReceived += amount
			}
		}

		for _, charge := range charges {
			amount := sanitizeAmount(charge.Amount)
			totalCharges += amount
			if normalizeChargeStatus(charge.Status) == "pago" {
				totalChargesPaid += amount
			}
		}

		rows = append(rows, projectPaymentRow{
			ProjectID:      project.ID,
			ProjectName:    project.Name,
			ProjectStatus:  normalizeProjectStatus(project.Status),
			Revenues:       revenues,
			MonthlyCharges: charges,
		})
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"summary": map[string]float64{
			"totalRevenue":         totalRevenue,
			"totalRevenueReceived": totalRevenueReceived,
			"totalRevenuePending":  totalRevenue - totalRevenueReceived,
			"totalCharges":         totalCharges,
			"totalChargesPaid":     totalChargesPaid,
			"totalChargesPending":  totalCharges - totalChargesPaid,
		},
		"projects": rows,
	})
}

func (h *Handler) HandleClientServiceRequests(w http.ResponseWriter, r *http.Request) {
	client, ok := h.authorizeClient(w, r)
	if !ok {
		return
	}

	trimmedPath := strings.TrimPrefix(r.URL.Path, "/client/service-requests")
	trimmedPath = strings.Trim(trimmedPath, "/")
	if trimmedPath != "" {
		segments := strings.Split(trimmedPath, "/")
		if len(segments) == 5 &&
			strings.EqualFold(strings.TrimSpace(segments[1]), "comments") &&
			strings.EqualFold(strings.TrimSpace(segments[3]), "files") {
			requestID := strings.TrimSpace(segments[0])
			commentID := strings.TrimSpace(segments[2])
			fileID := strings.TrimSpace(segments[4])
			if requestID == "" || commentID == "" || fileID == "" {
				h.respondError(w, http.StatusNotFound, "resource not found")
				return
			}

			hasAccess, err := h.clientCanAccessServiceRequest(r.Context(), client.ID, requestID)
			if err != nil {
				h.handlePortalUsecaseError(w, err, "")
				return
			}
			if !hasAccess {
				h.respondError(w, http.StatusNotFound, "resource not found")
				return
			}

			if r.Method != http.MethodDelete {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}

			err = h.clientPortalService.DeleteServiceRequestCommentFile(
				r.Context(),
				usecase.DeleteServiceRequestCommentFileInput{
					ServiceRequestID: requestID,
					CommentID:        commentID,
					FileID:           fileID,
					AuthorClientID:   client.ID,
				},
			)
			if err != nil {
				h.handlePortalUsecaseError(w, err, "")
				return
			}

			w.WriteHeader(http.StatusNoContent)
			return
		}

		if len(segments) == 3 && strings.EqualFold(strings.TrimSpace(segments[1]), "comments") {
			requestID := strings.TrimSpace(segments[0])
			commentID := strings.TrimSpace(segments[2])
			if requestID == "" || commentID == "" {
				h.respondError(w, http.StatusNotFound, "resource not found")
				return
			}

			hasAccess, err := h.clientCanAccessServiceRequest(r.Context(), client.ID, requestID)
			if err != nil {
				h.handlePortalUsecaseError(w, err, "")
				return
			}
			if !hasAccess {
				h.respondError(w, http.StatusNotFound, "resource not found")
				return
			}

			switch r.Method {
			case http.MethodPatch:
				var payload struct {
					Comment string               `json:"comment"`
					Files   []relatedFilePayload `json:"files"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					h.respondError(w, http.StatusBadRequest, "invalid json")
					return
				}

				err = h.clientPortalService.UpdateServiceRequestComment(
					r.Context(),
					usecase.UpdateServiceRequestCommentInput{
						ServiceRequestID: requestID,
						CommentID:        commentID,
						AuthorClientID:   client.ID,
						Comment:          payload.Comment,
						Files:            mapServiceRequestFilePayloads(payload.Files),
					},
				)
				if err != nil {
					h.handlePortalUsecaseError(w, err, "comment is required")
					return
				}

				w.WriteHeader(http.StatusNoContent)
			case http.MethodDelete:
				err = h.clientPortalService.DeleteServiceRequestComment(
					r.Context(),
					usecase.DeleteServiceRequestCommentInput{
						ServiceRequestID: requestID,
						CommentID:        commentID,
						AuthorClientID:   client.ID,
					},
				)
				if err != nil {
					h.handlePortalUsecaseError(w, err, "")
					return
				}

				w.WriteHeader(http.StatusNoContent)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
			return
		}

		if len(segments) == 2 && strings.EqualFold(strings.TrimSpace(segments[1]), "comments") {
			requestID := strings.TrimSpace(segments[0])
			if requestID == "" {
				h.respondError(w, http.StatusNotFound, "service request not found")
				return
			}

			hasAccess, err := h.clientCanAccessServiceRequest(r.Context(), client.ID, requestID)
			if err != nil {
				h.handlePortalUsecaseError(w, err, "")
				return
			}
			if !hasAccess {
				h.respondError(w, http.StatusNotFound, "resource not found")
				return
			}

			switch r.Method {
			case http.MethodGet:
				comments, err := h.clientPortalService.ListServiceRequestComments(r.Context(), requestID)
				if err != nil {
					h.handlePortalUsecaseError(w, err, "")
					return
				}

				h.respondJSON(w, http.StatusOK, comments)
			case http.MethodPost:
				var payload struct {
					ParentCommentID string               `json:"parentCommentId"`
					Comment         string               `json:"comment"`
					Files           []relatedFilePayload `json:"files"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					h.respondError(w, http.StatusBadRequest, "invalid json")
					return
				}

				comment, err := h.clientPortalService.CreateServiceRequestComment(
					r.Context(),
					usecase.CreateServiceRequestCommentInput{
						ServiceRequestID: requestID,
						ParentCommentID:  payload.ParentCommentID,
						AuthorClientID:   client.ID,
						Comment:          payload.Comment,
						Files:            mapServiceRequestFilePayloads(payload.Files),
					},
				)
				if err != nil {
					h.handlePortalUsecaseError(w, err, "comment is required")
					return
				}

				h.respondJSON(w, http.StatusCreated, comment)
			default:
				w.WriteHeader(http.StatusMethodNotAllowed)
			}
			return
		}

		if len(segments) != 1 {
			h.respondError(w, http.StatusNotFound, "route not found")
			return
		}

		requestID := strings.TrimSpace(segments[0])
		if requestID == "" {
			h.respondError(w, http.StatusNotFound, "service request not found")
			return
		}

		if r.Method != http.MethodPatch {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		request, err := h.clientPortalService.CancelServiceRequest(r.Context(), client.ID, requestID)
		if err != nil {
			if errors.Is(err, usecase.ErrConflict) {
				h.respondError(w, http.StatusConflict, "only open requests can be cancelled")
				return
			}
			h.handlePortalUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, request)
		return
	}

	switch r.Method {
	case http.MethodGet:
		requests, err := h.clientPortalService.ListServiceRequests(r.Context(), client.ID)
		if err != nil {
			h.handlePortalUsecaseError(w, err, "")
			return
		}
		h.respondJSON(w, http.StatusOK, requests)
	case http.MethodPost:
		var payload struct {
			ProjectID   string               `json:"projectId"`
			Title       string               `json:"title"`
			Description string               `json:"description"`
			Files       []relatedFilePayload `json:"files"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		request, err := h.clientPortalService.CreateServiceRequest(
			r.Context(),
			usecase.CreateClientServiceRequestInput{
				ClientID:    client.ID,
				ProjectID:   payload.ProjectID,
				Title:       payload.Title,
				Description: payload.Description,
				Files:       mapServiceRequestFilePayloads(payload.Files),
			},
		)
		if err != nil {
			if errors.Is(err, usecase.ErrUnauthorized) {
				h.respondError(w, http.StatusForbidden, "forbidden")
				return
			}
			h.handlePortalUsecaseError(w, err, "description is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, request)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *Handler) clientCanAccessServiceRequest(
	ctx context.Context,
	clientID string,
	requestID string,
) (bool, error) {
	requests, err := h.clientPortalService.ListServiceRequests(ctx, clientID)
	if err != nil {
		return false, err
	}

	for _, request := range requests {
		if strings.EqualFold(strings.TrimSpace(request.ID), strings.TrimSpace(requestID)) {
			return true, nil
		}
	}

	return false, nil
}

func (h *Handler) authorizeClient(
	w http.ResponseWriter,
	r *http.Request,
) (usecase.ClientPortalAuthUser, bool) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return usecase.ClientPortalAuthUser{}, false
	}
	if len(authHeader) < 7 || !strings.EqualFold(authHeader[:7], "Bearer ") {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return usecase.ClientPortalAuthUser{}, false
	}

	token := strings.TrimSpace(authHeader[7:])
	if token == "" {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return usecase.ClientPortalAuthUser{}, false
	}

	claims, err := h.tokenManager.ParseAndValidate(token, time.Now())
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return usecase.ClientPortalAuthUser{}, false
	}

	client, err := h.clientPortalService.ValidateSession(r.Context(), claims.Sub, claims.Login)
	if err != nil {
		if errors.Is(err, usecase.ErrUnauthorized) {
			h.respondError(w, http.StatusUnauthorized, "unauthorized")
			return usecase.ClientPortalAuthUser{}, false
		}
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
		return usecase.ClientPortalAuthUser{}, false
	}

	return client, true
}

func (h *Handler) handlePortalUsecaseError(
	w http.ResponseWriter,
	err error,
	defaultInvalidInputMessage string,
) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		message := defaultInvalidInputMessage
		if message == "" {
			message = "invalid input"
		}
		h.respondError(w, http.StatusBadRequest, message)
	case errors.Is(err, usecase.ErrInvalidCredentials):
		h.respondError(w, http.StatusUnauthorized, "credenciais inválidas")
	case errors.Is(err, usecase.ErrUnauthorized):
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, usecase.ErrNotFound):
		h.respondError(w, http.StatusNotFound, "resource not found")
	case errors.Is(err, usecase.ErrClientLoginInUse):
		h.respondError(w, http.StatusConflict, "client login already in use")
	case errors.Is(err, usecase.ErrClientEmailInUse):
		h.respondError(w, http.StatusConflict, "client email already in use")
	default:
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}

func (h *Handler) handleProjectUsecaseError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, usecase.ErrInvalidInput):
		h.respondError(w, http.StatusBadRequest, "invalid input")
	case errors.Is(err, usecase.ErrNotFound):
		h.respondError(w, http.StatusNotFound, "project not found")
	default:
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}

func mapRelatedFilePayloads(files []relatedFilePayload) []usecase.CreateProjectFileInput {
	mapped := make([]usecase.CreateProjectFileInput, 0, len(files))
	for _, file := range files {
		normalizedFileName := strings.TrimSpace(file.FileName)
		normalizedFileKey := strings.TrimSpace(file.FileKey)
		if normalizedFileName == "" && normalizedFileKey == "" {
			continue
		}
		mapped = append(mapped, usecase.CreateProjectFileInput{
			FileName:    normalizedFileName,
			FileKey:     normalizedFileKey,
			ContentType: strings.TrimSpace(file.ContentType),
			Notes:       strings.TrimSpace(file.Notes),
		})
	}

	return mapped
}

func mapServiceRequestFilePayloads(
	files []relatedFilePayload,
) []usecase.CreateClientServiceRequestFileInput {
	mapped := make([]usecase.CreateClientServiceRequestFileInput, 0, len(files))
	for _, file := range files {
		normalizedFileName := strings.TrimSpace(file.FileName)
		normalizedFileKey := strings.TrimSpace(file.FileKey)
		if normalizedFileName == "" && normalizedFileKey == "" {
			continue
		}
		mapped = append(mapped, usecase.CreateClientServiceRequestFileInput{
			FileName:    normalizedFileName,
			FileKey:     normalizedFileKey,
			ContentType: strings.TrimSpace(file.ContentType),
			Notes:       strings.TrimSpace(file.Notes),
		})
	}

	return mapped
}

func normalizeProjectStatus(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "planejamento", "andamento", "concluido", "cancelado":
		return normalized
	default:
		return "planejamento"
	}
}

func normalizeRevenueStatus(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "pendente", "recebido", "cancelado":
		return normalized
	default:
		return "pendente"
	}
}

func normalizeChargeStatus(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "pendente", "pago", "cancelada":
		return normalized
	default:
		return "pendente"
	}
}

func sanitizeAmount(value float64) float64 {
	if value < 0 {
		return 0
	}
	return value
}

func pickRevenueDate(revenue usecase.ProjectRevenue) time.Time {
	if revenue.ReceivedOn != nil {
		return revenue.ReceivedOn.UTC()
	}
	if revenue.ExpectedOn != nil {
		return revenue.ExpectedOn.UTC()
	}
	if !revenue.Updated.IsZero() {
		return revenue.Updated.UTC()
	}
	if !revenue.Created.IsZero() {
		return revenue.Created.UTC()
	}
	return time.Time{}
}
