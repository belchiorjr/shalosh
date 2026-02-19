package usecase

import (
	"context"
	"errors"
	"strings"
	"time"
)

type ClientPortalRepository interface {
	FindClientByLoginOrEmail(ctx context.Context, login string) (ClientPortalAuthUser, error)
	GetClientAuthByID(ctx context.Context, clientID string) (ClientPortalAuthUser, error)
	CreateBasicClient(ctx context.Context, input CreateClientPortalAccountInput) (ClientPortalAccount, error)
	GetClientAccount(ctx context.Context, clientID string) (ClientPortalAccount, error)
	UpdateClientAccount(ctx context.Context, input UpdateClientPortalAccountInput) (ClientPortalAccount, error)

	ListClientProjects(ctx context.Context, clientID string) ([]ClientPortalProject, error)
	ClientHasProjectAccess(ctx context.Context, clientID, projectID string) (bool, error)
	CountOpenServiceRequests(ctx context.Context, clientID string) (int, error)

	ListClientServiceRequests(ctx context.Context, clientID string) ([]ClientServiceRequest, error)
	CreateClientServiceRequest(ctx context.Context, input CreateClientServiceRequestInput) (ClientServiceRequest, error)
	CancelClientServiceRequest(
		ctx context.Context,
		clientID string,
		requestID string,
	) (ClientServiceRequest, error)

	ListAdminServiceRequests(ctx context.Context) ([]AdminServiceRequest, error)
	GetAdminServiceRequest(ctx context.Context, requestID string) (AdminServiceRequest, error)
	UpdateAdminServiceRequestStatus(
		ctx context.Context,
		input UpdateAdminServiceRequestStatusInput,
	) (AdminServiceRequest, error)
	ListServiceRequestComments(ctx context.Context, requestID string) ([]ServiceRequestComment, error)
	CreateServiceRequestComment(
		ctx context.Context,
		input CreateServiceRequestCommentInput,
	) (ServiceRequestComment, error)
	UpdateServiceRequestComment(
		ctx context.Context,
		input UpdateServiceRequestCommentInput,
	) error
	DeleteServiceRequestComment(
		ctx context.Context,
		input DeleteServiceRequestCommentInput,
	) error
	DeleteServiceRequestCommentFile(
		ctx context.Context,
		input DeleteServiceRequestCommentFileInput,
	) error
}

type ClientPortalService struct {
	repo ClientPortalRepository
}

func NewClientPortalService(repo ClientPortalRepository) *ClientPortalService {
	return &ClientPortalService{repo: repo}
}

type ClientPortalAuthUser struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Login    string `json:"login"`
	Password string `json:"-"`
	Avatar   string `json:"avatar"`
	Active   bool   `json:"active"`
}

type ClientPortalAccount struct {
	ID      string    `json:"id"`
	Name    string    `json:"name"`
	Email   string    `json:"email"`
	Login   string    `json:"login"`
	Avatar  string    `json:"avatar"`
	Active  bool      `json:"active"`
	Created time.Time `json:"created"`
	Updated time.Time `json:"updated"`
}

type CreateClientPortalAccountInput struct {
	Login    string
	Password string
	Name     string
	Email    string
	Avatar   string
}

type UpdateClientPortalAccountInput struct {
	ClientID string
	Name     string
	Email    string
	Login    string
	Password string
	Avatar   string
}

type ClientPortalProject struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Objective string     `json:"objective"`
	Status    string     `json:"status"`
	Active    bool       `json:"active"`
	StartDate *time.Time `json:"startDate,omitempty"`
	EndDate   *time.Time `json:"endDate,omitempty"`
	Created   time.Time  `json:"created"`
	Updated   time.Time  `json:"updated"`
}

type ClientServiceRequestFile struct {
	ID          string    `json:"id"`
	FileName    string    `json:"fileName"`
	FileKey     string    `json:"fileKey"`
	ContentType string    `json:"contentType"`
	Notes       string    `json:"notes"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
}

type ClientServiceRequest struct {
	ID          string                     `json:"id"`
	ClientID    string                     `json:"clientId"`
	ProjectID   string                     `json:"projectId,omitempty"`
	ProjectName string                     `json:"projectName,omitempty"`
	Title       string                     `json:"title"`
	Description string                     `json:"description"`
	Status      string                     `json:"status"`
	Files       []ClientServiceRequestFile `json:"files"`
	Created     time.Time                  `json:"created"`
	Updated     time.Time                  `json:"updated"`
}

type AdminServiceRequest struct {
	ID           string                     `json:"id"`
	ClientID     string                     `json:"clientId"`
	ClientName   string                     `json:"clientName"`
	ClientEmail  string                     `json:"clientEmail"`
	ClientLogin  string                     `json:"clientLogin"`
	ProjectID    string                     `json:"projectId,omitempty"`
	ProjectName  string                     `json:"projectName,omitempty"`
	Title        string                     `json:"title"`
	Description  string                     `json:"description"`
	Status       string                     `json:"status"`
	Files        []ClientServiceRequestFile `json:"files"`
	Comments     int                        `json:"comments"`
	OpenComments int                        `json:"openComments"`
	Created      time.Time                  `json:"created"`
	Updated      time.Time                  `json:"updated"`
}

type ServiceRequestCommentFile struct {
	ID          string    `json:"id"`
	FileName    string    `json:"fileName"`
	FileKey     string    `json:"fileKey"`
	ContentType string    `json:"contentType"`
	Notes       string    `json:"notes"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
}

type ServiceRequestComment struct {
	ID               string                      `json:"id"`
	ServiceRequestID string                      `json:"serviceRequestId"`
	ParentCommentID  string                      `json:"parentCommentId,omitempty"`
	UserID           string                      `json:"userId,omitempty"`
	ClientID         string                      `json:"clientId,omitempty"`
	AuthorName       string                      `json:"authorName"`
	AuthorAvatar     string                      `json:"authorAvatar,omitempty"`
	AuthorType       string                      `json:"authorType"`
	Comment          string                      `json:"comment"`
	Files            []ServiceRequestCommentFile `json:"files"`
	Created          time.Time                   `json:"created"`
	Updated          time.Time                   `json:"updated"`
}

type CreateClientServiceRequestFileInput struct {
	FileName    string
	FileKey     string
	ContentType string
	Notes       string
}

type CreateClientServiceRequestInput struct {
	ClientID    string
	ProjectID   string
	Title       string
	Description string
	Files       []CreateClientServiceRequestFileInput
}

type UpdateAdminServiceRequestStatusInput struct {
	RequestID string
	Status    string
}

type CreateServiceRequestCommentInput struct {
	ServiceRequestID string
	ParentCommentID  string
	AuthorUserID     string
	AuthorClientID   string
	Comment          string
	Files            []CreateClientServiceRequestFileInput
}

type DeleteServiceRequestCommentFileInput struct {
	ServiceRequestID string
	CommentID        string
	FileID           string
	AuthorUserID     string
	AuthorClientID   string
}

type DeleteServiceRequestCommentInput struct {
	ServiceRequestID string
	CommentID        string
	AuthorUserID     string
	AuthorClientID   string
}

type UpdateServiceRequestCommentInput struct {
	ServiceRequestID string
	CommentID        string
	AuthorUserID     string
	AuthorClientID   string
	Comment          string
	Files            []CreateClientServiceRequestFileInput
}

func (s *ClientPortalService) Authenticate(
	ctx context.Context,
	login string,
	password string,
) (ClientPortalAuthUser, error) {
	normalizedLogin := strings.TrimSpace(login)
	normalizedPassword := strings.TrimSpace(password)
	if normalizedLogin == "" || normalizedPassword == "" {
		return ClientPortalAuthUser{}, ErrInvalidInput
	}

	client, err := s.repo.FindClientByLoginOrEmail(ctx, normalizedLogin)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return ClientPortalAuthUser{}, ErrInvalidCredentials
		}
		return ClientPortalAuthUser{}, err
	}

	if !client.Active || client.Password != normalizedPassword {
		return ClientPortalAuthUser{}, ErrInvalidCredentials
	}

	client.Password = ""
	return client, nil
}

func (s *ClientPortalService) ValidateSession(
	ctx context.Context,
	clientID string,
	login string,
) (ClientPortalAuthUser, error) {
	normalizedID := strings.TrimSpace(clientID)
	normalizedLogin := strings.TrimSpace(login)
	if normalizedID == "" || normalizedLogin == "" {
		return ClientPortalAuthUser{}, ErrUnauthorized
	}

	client, err := s.repo.GetClientAuthByID(ctx, normalizedID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return ClientPortalAuthUser{}, ErrUnauthorized
		}
		return ClientPortalAuthUser{}, err
	}

	if !client.Active || !strings.EqualFold(client.Login, normalizedLogin) {
		return ClientPortalAuthUser{}, ErrUnauthorized
	}

	client.Password = ""
	return client, nil
}

func (s *ClientPortalService) Register(
	ctx context.Context,
	input CreateClientPortalAccountInput,
) (ClientPortalAccount, error) {
	normalizedLogin := strings.ToLower(strings.TrimSpace(input.Login))
	normalizedPassword := strings.TrimSpace(input.Password)
	normalizedName := strings.TrimSpace(input.Name)
	normalizedEmail := strings.TrimSpace(input.Email)
	normalizedAvatar := strings.TrimSpace(input.Avatar)

	if normalizedLogin == "" || normalizedPassword == "" {
		return ClientPortalAccount{}, ErrInvalidInput
	}
	if normalizedName == "" {
		normalizedName = normalizedLogin
	}
	if normalizedEmail == "" {
		normalizedEmail = normalizedLogin + "@cliente.local"
	}

	return s.repo.CreateBasicClient(ctx, CreateClientPortalAccountInput{
		Login:    normalizedLogin,
		Password: normalizedPassword,
		Name:     normalizedName,
		Email:    normalizedEmail,
		Avatar:   normalizedAvatar,
	})
}

func (s *ClientPortalService) GetAccount(
	ctx context.Context,
	clientID string,
) (ClientPortalAccount, error) {
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return ClientPortalAccount{}, ErrInvalidInput
	}

	return s.repo.GetClientAccount(ctx, normalizedID)
}

func (s *ClientPortalService) UpdateAccount(
	ctx context.Context,
	input UpdateClientPortalAccountInput,
) (ClientPortalAccount, error) {
	normalizedInput := UpdateClientPortalAccountInput{
		ClientID: strings.TrimSpace(input.ClientID),
		Name:     strings.TrimSpace(input.Name),
		Email:    strings.TrimSpace(input.Email),
		Login:    strings.ToLower(strings.TrimSpace(input.Login)),
		Password: strings.TrimSpace(input.Password),
		Avatar:   strings.TrimSpace(input.Avatar),
	}

	if normalizedInput.ClientID == "" ||
		normalizedInput.Name == "" ||
		normalizedInput.Email == "" ||
		normalizedInput.Login == "" {
		return ClientPortalAccount{}, ErrInvalidInput
	}

	return s.repo.UpdateClientAccount(ctx, normalizedInput)
}

func (s *ClientPortalService) ListProjects(
	ctx context.Context,
	clientID string,
) ([]ClientPortalProject, error) {
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListClientProjects(ctx, normalizedID)
}

func (s *ClientPortalService) HasProjectAccess(
	ctx context.Context,
	clientID string,
	projectID string,
) (bool, error) {
	normalizedClientID := strings.TrimSpace(clientID)
	normalizedProjectID := strings.TrimSpace(projectID)
	if normalizedClientID == "" || normalizedProjectID == "" {
		return false, ErrInvalidInput
	}

	return s.repo.ClientHasProjectAccess(ctx, normalizedClientID, normalizedProjectID)
}

func (s *ClientPortalService) CountOpenRequests(
	ctx context.Context,
	clientID string,
) (int, error) {
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return 0, ErrInvalidInput
	}

	return s.repo.CountOpenServiceRequests(ctx, normalizedID)
}

func (s *ClientPortalService) ListServiceRequests(
	ctx context.Context,
	clientID string,
) ([]ClientServiceRequest, error) {
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListClientServiceRequests(ctx, normalizedID)
}

func (s *ClientPortalService) CreateServiceRequest(
	ctx context.Context,
	input CreateClientServiceRequestInput,
) (ClientServiceRequest, error) {
	normalizedInput := CreateClientServiceRequestInput{
		ClientID:    strings.TrimSpace(input.ClientID),
		ProjectID:   strings.TrimSpace(input.ProjectID),
		Title:       strings.TrimSpace(input.Title),
		Description: strings.TrimSpace(input.Description),
		Files:       make([]CreateClientServiceRequestFileInput, 0, len(input.Files)),
	}

	if normalizedInput.ClientID == "" || normalizedInput.Description == "" {
		return ClientServiceRequest{}, ErrInvalidInput
	}
	if normalizedInput.Title == "" {
		normalizedInput.Title = "Solicitação"
	}

	for _, file := range input.Files {
		normalizedFile := CreateClientServiceRequestFileInput{
			FileName:    strings.TrimSpace(file.FileName),
			FileKey:     strings.TrimSpace(file.FileKey),
			ContentType: strings.TrimSpace(file.ContentType),
			Notes:       strings.TrimSpace(file.Notes),
		}
		if normalizedFile.FileName == "" && normalizedFile.FileKey == "" {
			continue
		}
		normalizedInput.Files = append(normalizedInput.Files, normalizedFile)
	}

	if normalizedInput.ProjectID != "" {
		hasAccess, err := s.repo.ClientHasProjectAccess(
			ctx,
			normalizedInput.ClientID,
			normalizedInput.ProjectID,
		)
		if err != nil {
			return ClientServiceRequest{}, err
		}
		if !hasAccess {
			return ClientServiceRequest{}, ErrUnauthorized
		}
	}

	return s.repo.CreateClientServiceRequest(ctx, normalizedInput)
}

func (s *ClientPortalService) CancelServiceRequest(
	ctx context.Context,
	clientID string,
	requestID string,
) (ClientServiceRequest, error) {
	normalizedClientID := strings.TrimSpace(clientID)
	normalizedRequestID := strings.TrimSpace(requestID)
	if normalizedClientID == "" || normalizedRequestID == "" {
		return ClientServiceRequest{}, ErrInvalidInput
	}

	return s.repo.CancelClientServiceRequest(ctx, normalizedClientID, normalizedRequestID)
}

func (s *ClientPortalService) ListAdminServiceRequests(
	ctx context.Context,
) ([]AdminServiceRequest, error) {
	return s.repo.ListAdminServiceRequests(ctx)
}

func (s *ClientPortalService) GetAdminServiceRequest(
	ctx context.Context,
	requestID string,
) (AdminServiceRequest, error) {
	normalizedRequestID := strings.TrimSpace(requestID)
	if normalizedRequestID == "" {
		return AdminServiceRequest{}, ErrInvalidInput
	}

	return s.repo.GetAdminServiceRequest(ctx, normalizedRequestID)
}

func (s *ClientPortalService) UpdateAdminServiceRequestStatus(
	ctx context.Context,
	input UpdateAdminServiceRequestStatusInput,
) (AdminServiceRequest, error) {
	normalizedInput := UpdateAdminServiceRequestStatusInput{
		RequestID: strings.TrimSpace(input.RequestID),
		Status:    normalizeServiceRequestStatus(strings.TrimSpace(input.Status)),
	}

	if normalizedInput.RequestID == "" || normalizedInput.Status == "" {
		return AdminServiceRequest{}, ErrInvalidInput
	}

	if normalizedInput.Status != "concluida" && normalizedInput.Status != "cancelada" {
		return AdminServiceRequest{}, ErrInvalidInput
	}

	return s.repo.UpdateAdminServiceRequestStatus(ctx, normalizedInput)
}

func (s *ClientPortalService) ListServiceRequestComments(
	ctx context.Context,
	requestID string,
) ([]ServiceRequestComment, error) {
	normalizedRequestID := strings.TrimSpace(requestID)
	if normalizedRequestID == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListServiceRequestComments(ctx, normalizedRequestID)
}

func (s *ClientPortalService) CreateServiceRequestComment(
	ctx context.Context,
	input CreateServiceRequestCommentInput,
) (ServiceRequestComment, error) {
	normalizedInput := CreateServiceRequestCommentInput{
		ServiceRequestID: strings.TrimSpace(input.ServiceRequestID),
		ParentCommentID:  strings.TrimSpace(input.ParentCommentID),
		AuthorUserID:     strings.TrimSpace(input.AuthorUserID),
		AuthorClientID:   strings.TrimSpace(input.AuthorClientID),
		Comment:          strings.TrimSpace(input.Comment),
		Files:            make([]CreateClientServiceRequestFileInput, 0, len(input.Files)),
	}

	if normalizedInput.ServiceRequestID == "" || normalizedInput.Comment == "" {
		return ServiceRequestComment{}, ErrInvalidInput
	}

	if normalizedInput.AuthorUserID == "" && normalizedInput.AuthorClientID == "" {
		return ServiceRequestComment{}, ErrInvalidInput
	}

	for _, file := range input.Files {
		normalizedFile := CreateClientServiceRequestFileInput{
			FileName:    strings.TrimSpace(file.FileName),
			FileKey:     strings.TrimSpace(file.FileKey),
			ContentType: strings.TrimSpace(file.ContentType),
			Notes:       strings.TrimSpace(file.Notes),
		}
		if normalizedFile.FileName == "" && normalizedFile.FileKey == "" {
			continue
		}
		normalizedInput.Files = append(normalizedInput.Files, normalizedFile)
	}

	return s.repo.CreateServiceRequestComment(ctx, normalizedInput)
}

func (s *ClientPortalService) DeleteServiceRequestCommentFile(
	ctx context.Context,
	input DeleteServiceRequestCommentFileInput,
) error {
	normalizedInput := DeleteServiceRequestCommentFileInput{
		ServiceRequestID: strings.TrimSpace(input.ServiceRequestID),
		CommentID:        strings.TrimSpace(input.CommentID),
		FileID:           strings.TrimSpace(input.FileID),
		AuthorUserID:     strings.TrimSpace(input.AuthorUserID),
		AuthorClientID:   strings.TrimSpace(input.AuthorClientID),
	}

	if normalizedInput.ServiceRequestID == "" || normalizedInput.CommentID == "" || normalizedInput.FileID == "" {
		return ErrInvalidInput
	}

	if normalizedInput.AuthorUserID == "" && normalizedInput.AuthorClientID == "" {
		return ErrInvalidInput
	}

	return s.repo.DeleteServiceRequestCommentFile(ctx, normalizedInput)
}

func (s *ClientPortalService) DeleteServiceRequestComment(
	ctx context.Context,
	input DeleteServiceRequestCommentInput,
) error {
	normalizedInput := DeleteServiceRequestCommentInput{
		ServiceRequestID: strings.TrimSpace(input.ServiceRequestID),
		CommentID:        strings.TrimSpace(input.CommentID),
		AuthorUserID:     strings.TrimSpace(input.AuthorUserID),
		AuthorClientID:   strings.TrimSpace(input.AuthorClientID),
	}

	if normalizedInput.ServiceRequestID == "" || normalizedInput.CommentID == "" {
		return ErrInvalidInput
	}
	if normalizedInput.AuthorUserID == "" && normalizedInput.AuthorClientID == "" {
		return ErrInvalidInput
	}

	return s.repo.DeleteServiceRequestComment(ctx, normalizedInput)
}

func (s *ClientPortalService) UpdateServiceRequestComment(
	ctx context.Context,
	input UpdateServiceRequestCommentInput,
) error {
	normalizedInput := UpdateServiceRequestCommentInput{
		ServiceRequestID: strings.TrimSpace(input.ServiceRequestID),
		CommentID:        strings.TrimSpace(input.CommentID),
		AuthorUserID:     strings.TrimSpace(input.AuthorUserID),
		AuthorClientID:   strings.TrimSpace(input.AuthorClientID),
		Comment:          strings.TrimSpace(input.Comment),
		Files:            make([]CreateClientServiceRequestFileInput, 0, len(input.Files)),
	}

	if normalizedInput.ServiceRequestID == "" || normalizedInput.CommentID == "" || normalizedInput.Comment == "" {
		return ErrInvalidInput
	}
	if normalizedInput.AuthorUserID == "" && normalizedInput.AuthorClientID == "" {
		return ErrInvalidInput
	}

	for _, file := range input.Files {
		normalizedFile := CreateClientServiceRequestFileInput{
			FileName:    strings.TrimSpace(file.FileName),
			FileKey:     strings.TrimSpace(file.FileKey),
			ContentType: strings.TrimSpace(file.ContentType),
			Notes:       strings.TrimSpace(file.Notes),
		}
		if normalizedFile.FileName == "" && normalizedFile.FileKey == "" {
			continue
		}
		normalizedInput.Files = append(normalizedInput.Files, normalizedFile)
	}

	return s.repo.UpdateServiceRequestComment(ctx, normalizedInput)
}

func normalizeServiceRequestStatus(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "aberta", "em_andamento", "concluida", "cancelada":
		return normalized
	default:
		return ""
	}
}
