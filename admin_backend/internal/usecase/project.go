package usecase

import (
	"context"
	"strings"
	"time"
)

var allowedProjectLifecycleTypes = map[string]struct{}{
	"temporario": {},
	"recorrente": {},
}

var allowedProjectStatuses = map[string]struct{}{
	"planejamento": {},
	"andamento":    {},
	"concluido":    {},
	"cancelado":    {},
}

var allowedProjectRevenueStatuses = map[string]struct{}{
	"pendente":  {},
	"recebido":  {},
	"cancelado": {},
}

var allowedProjectTaskStatuses = map[string]struct{}{
	"planejada": {},
	"iniciada":  {},
	"concluida": {},
	"cancelada": {},
}

var allowedProjectMonthlyChargeStatuses = map[string]struct{}{
	"pendente":  {},
	"pago":      {},
	"cancelada": {},
}

type ProjectRepository interface {
	ListProjects(ctx context.Context, filter ProjectListFilter) ([]ProjectListItem, error)
	GetProjectDetail(ctx context.Context, projectID string) (ProjectDetail, error)
	CreateProject(ctx context.Context, input CreateProjectInput) (ProjectDetail, error)
	UpdateProject(ctx context.Context, input UpdateProjectInput) (ProjectDetail, error)
	UpdateProjectStatus(ctx context.Context, input UpdateProjectStatusInput) (ProjectDetail, error)
	DeleteProject(ctx context.Context, projectID string) error
	RecalculateProjectTimeline(ctx context.Context, projectID string) (ProjectDetail, error)

	ListProjectCategories(ctx context.Context) ([]ProjectCategory, error)
	ListProjectTypes(ctx context.Context, filter ProjectTypeListFilter) ([]ProjectType, error)
	CreateProjectType(ctx context.Context, input CreateProjectTypeInput) (ProjectType, error)
	UpdateProjectType(ctx context.Context, input UpdateProjectTypeInput) (ProjectType, error)

	ListProjectRevenues(ctx context.Context, projectID string) ([]ProjectRevenue, error)
	CreateProjectRevenue(ctx context.Context, input CreateProjectRevenueInput) (ProjectRevenue, error)
	UpdateProjectRevenueStatus(
		ctx context.Context,
		input UpdateProjectRevenueStatusInput,
	) error

	ListProjectMonthlyCharges(ctx context.Context, projectID string) ([]ProjectMonthlyCharge, error)
	CreateProjectMonthlyCharge(ctx context.Context, input CreateProjectMonthlyChargeInput) (ProjectMonthlyCharge, error)
	UpdateProjectMonthlyCharge(
		ctx context.Context,
		input UpdateProjectMonthlyChargeInput,
	) (ProjectMonthlyCharge, error)
	UpdateProjectMonthlyChargeStatus(
		ctx context.Context,
		input UpdateProjectMonthlyChargeStatusInput,
	) (ProjectMonthlyCharge, error)
	UpdateProjectMonthlyChargeAmount(
		ctx context.Context,
		input UpdateProjectMonthlyChargeAmountInput,
	) (ProjectMonthlyCharge, error)
	DeleteProjectMonthlyCharge(ctx context.Context, projectID, monthlyChargeID string) error

	ListProjectPhases(ctx context.Context, projectID string) ([]ProjectPhase, error)
	CreateProjectPhase(ctx context.Context, input CreateProjectPhaseInput) (ProjectPhase, error)
	UpdateProjectPhase(ctx context.Context, input UpdateProjectPhaseInput) (ProjectPhase, error)

	ListProjectTasks(ctx context.Context, projectID string) ([]ProjectTask, error)
	CreateProjectTask(ctx context.Context, input CreateProjectTaskInput) (ProjectTask, error)
	UpdateProjectTask(ctx context.Context, input UpdateProjectTaskInput) (ProjectTask, error)
	ListProjectTaskComments(
		ctx context.Context,
		projectID string,
		taskID string,
	) ([]ProjectTaskComment, error)
	CreateProjectTaskComment(
		ctx context.Context,
		input CreateProjectTaskCommentInput,
	) (ProjectTaskComment, error)
}

type ProjectService struct {
	repo ProjectRepository
}

func NewProjectService(repo ProjectRepository) *ProjectService {
	return &ProjectService{repo: repo}
}

type ProjectListFilter struct {
	Search     string
	OnlyActive bool
}

type ProjectTypeListFilter struct {
	CategoryID string
	OnlyActive bool
}

type ProjectCategory struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Active      bool      `json:"active"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
}

type ProjectType struct {
	ID           string    `json:"id"`
	CategoryID   string    `json:"categoryId"`
	CategoryCode string    `json:"categoryCode"`
	CategoryName string    `json:"categoryName"`
	Code         string    `json:"code"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Active       bool      `json:"active"`
	Created      time.Time `json:"created"`
	Updated      time.Time `json:"updated"`
}

type ProjectClient struct {
	ClientID string `json:"clientId"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Login    string `json:"login"`
	Role     string `json:"role"`
}

type ProjectManager struct {
	UserID string `json:"userId"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Login  string `json:"login"`
}

type ProjectRelatedFile struct {
	ID          string    `json:"id"`
	FileName    string    `json:"fileName"`
	FileKey     string    `json:"fileKey"`
	ContentType string    `json:"contentType"`
	Notes       string    `json:"notes"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
}

type ProjectRevenueReceipt struct {
	ID               string     `json:"id"`
	ProjectRevenueID string     `json:"projectRevenueId"`
	FileName         string     `json:"fileName"`
	FileKey          string     `json:"fileKey"`
	ContentType      string     `json:"contentType"`
	IssuedOn         *time.Time `json:"issuedOn,omitempty"`
	Notes            string     `json:"notes"`
	Created          time.Time  `json:"created"`
	Updated          time.Time  `json:"updated"`
}

type ProjectRevenue struct {
	ID          string                  `json:"id"`
	ProjectID   string                  `json:"projectId"`
	Title       string                  `json:"title"`
	Description string                  `json:"description"`
	Objective   string                  `json:"objective"`
	Amount      float64                 `json:"amount"`
	ExpectedOn  *time.Time              `json:"expectedOn,omitempty"`
	ReceivedOn  *time.Time              `json:"receivedOn,omitempty"`
	Status      string                  `json:"status"`
	Active      bool                    `json:"active"`
	Receipts    []ProjectRevenueReceipt `json:"receipts"`
	Created     time.Time               `json:"created"`
	Updated     time.Time               `json:"updated"`
}

type ProjectMonthlyCharge struct {
	ID          string     `json:"id"`
	ProjectID   string     `json:"projectId"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Installment string     `json:"installment"`
	Status      string     `json:"status"`
	Amount      float64    `json:"amount"`
	DueDay      int        `json:"dueDay"`
	StartsOn    *time.Time `json:"startsOn,omitempty"`
	EndsOn      *time.Time `json:"endsOn,omitempty"`
	Active      bool       `json:"active"`
	Created     time.Time  `json:"created"`
	Updated     time.Time  `json:"updated"`
}

type ProjectPhase struct {
	ID          string               `json:"id"`
	ProjectID   string               `json:"projectId"`
	Name        string               `json:"name"`
	Description string               `json:"description"`
	Objective   string               `json:"objective"`
	StartsOn    *time.Time           `json:"startsOn,omitempty"`
	EndsOn      *time.Time           `json:"endsOn,omitempty"`
	Position    int                  `json:"position"`
	Active      bool                 `json:"active"`
	Files       []ProjectRelatedFile `json:"files"`
	Created     time.Time            `json:"created"`
	Updated     time.Time            `json:"updated"`
}

type ProjectTask struct {
	ID                  string               `json:"id"`
	ProjectID           string               `json:"projectId"`
	ProjectPhaseID      string               `json:"projectPhaseId,omitempty"`
	ResponsibleUserID   string               `json:"responsibleUserId,omitempty"`
	ResponsibleUserName string               `json:"responsibleUserName"`
	Name                string               `json:"name"`
	Description         string               `json:"description"`
	Objective           string               `json:"objective"`
	StartsOn            *time.Time           `json:"startsOn,omitempty"`
	EndsOn              *time.Time           `json:"endsOn,omitempty"`
	Position            int                  `json:"position"`
	Status              string               `json:"status"`
	Active              bool                 `json:"active"`
	Files               []ProjectRelatedFile `json:"files"`
	Created             time.Time            `json:"created"`
	Updated             time.Time            `json:"updated"`
}

type ProjectTaskComment struct {
	ID                string               `json:"id"`
	ProjectTaskID     string               `json:"projectTaskId"`
	ParentCommentID   string               `json:"parentCommentId,omitempty"`
	UserID            string               `json:"userId,omitempty"`
	ClientID          string               `json:"clientId,omitempty"`
	AuthorName        string               `json:"authorName"`
	AuthorType        string               `json:"authorType"`
	IsProjectManager  bool                 `json:"isProjectManager"`
	IsTaskResponsible bool                 `json:"isTaskResponsible"`
	Comment           string               `json:"comment"`
	Files             []ProjectRelatedFile `json:"files"`
	Created           time.Time            `json:"created"`
	Updated           time.Time            `json:"updated"`
}

type ProjectListItem struct {
	ID                    string     `json:"id"`
	Name                  string     `json:"name"`
	Objective             string     `json:"objective"`
	ProjectTypeID         string     `json:"projectTypeId"`
	ProjectTypeName       string     `json:"projectTypeName"`
	ProjectCategoryName   string     `json:"projectCategoryName"`
	LifecycleType         string     `json:"lifecycleType"`
	HasMonthlyMaintenance bool       `json:"hasMonthlyMaintenance"`
	StartDate             *time.Time `json:"startDate,omitempty"`
	EndDate               *time.Time `json:"endDate,omitempty"`
	Status                string     `json:"status"`
	Active                bool       `json:"active"`
	ClientsCount          int        `json:"clientsCount"`
	RevenuesCount         int        `json:"revenuesCount"`
	MonthlyChargesCount   int        `json:"monthlyChargesCount"`
	PhasesCount           int        `json:"phasesCount"`
	TasksCount            int        `json:"tasksCount"`
	Created               time.Time  `json:"created"`
	Updated               time.Time  `json:"updated"`
}

type ProjectDetail struct {
	ID                    string                 `json:"id"`
	Name                  string                 `json:"name"`
	Objective             string                 `json:"objective"`
	ProjectTypeID         string                 `json:"projectTypeId"`
	ProjectTypeName       string                 `json:"projectTypeName"`
	ProjectCategoryName   string                 `json:"projectCategoryName"`
	LifecycleType         string                 `json:"lifecycleType"`
	HasMonthlyMaintenance bool                   `json:"hasMonthlyMaintenance"`
	StartDate             *time.Time             `json:"startDate,omitempty"`
	EndDate               *time.Time             `json:"endDate,omitempty"`
	Status                string                 `json:"status"`
	Active                bool                   `json:"active"`
	Created               time.Time              `json:"created"`
	Updated               time.Time              `json:"updated"`
	Clients               []ProjectClient        `json:"clients"`
	Managers              []ProjectManager       `json:"managers"`
	Revenues              []ProjectRevenue       `json:"revenues"`
	MonthlyCharges        []ProjectMonthlyCharge `json:"monthlyCharges"`
	Phases                []ProjectPhase         `json:"phases"`
	Tasks                 []ProjectTask          `json:"tasks"`
}

type CreateProjectInput struct {
	Name                  string
	Objective             string
	ProjectTypeID         string
	LifecycleType         string
	HasMonthlyMaintenance bool
	StartDate             *time.Time
	EndDate               *time.Time
	Active                bool
	ClientIDs             []string
	ManagerUserIDs        []string
}

type UpdateProjectInput struct {
	ID                    string
	Name                  string
	Objective             string
	ProjectTypeID         string
	LifecycleType         string
	HasMonthlyMaintenance bool
	StartDate             *time.Time
	EndDate               *time.Time
	Active                *bool
	ClientIDs             *[]string
	ManagerUserIDs        *[]string
}

type UpdateProjectStatusInput struct {
	ID     string
	Status string
}

type CreateProjectTypeInput struct {
	CategoryID  string
	Code        string
	Name        string
	Description string
	Active      bool
}

type UpdateProjectTypeInput struct {
	ID          string
	CategoryID  string
	Code        string
	Name        string
	Description string
	Active      *bool
}

type CreateProjectRevenueReceiptInput struct {
	FileName    string
	FileKey     string
	ContentType string
	IssuedOn    *time.Time
	Notes       string
}

type CreateProjectRevenueInput struct {
	ProjectID   string
	Title       string
	Description string
	Objective   string
	Amount      float64
	ExpectedOn  *time.Time
	ReceivedOn  *time.Time
	Status      string
	Active      bool
	Receipts    []CreateProjectRevenueReceiptInput
}

type UpdateProjectRevenueStatusInput struct {
	ID        string
	ProjectID string
	Status    string
}

type CreateProjectMonthlyChargeInput struct {
	ProjectID   string
	Title       string
	Description string
	Installment string
	Status      string
	Amount      float64
	DueDay      int
	StartsOn    *time.Time
	EndsOn      *time.Time
	Active      bool
}

type UpdateProjectMonthlyChargeInput struct {
	ID          string
	ProjectID   string
	Title       string
	Description string
	Installment string
	Status      string
	Amount      float64
	DueDay      int
	StartsOn    *time.Time
	EndsOn      *time.Time
	Active      bool
}

type UpdateProjectMonthlyChargeStatusInput struct {
	ID        string
	ProjectID string
	Status    string
}

type UpdateProjectMonthlyChargeAmountInput struct {
	ID        string
	ProjectID string
	Amount    float64
}

type CreateProjectFileInput struct {
	FileName    string
	FileKey     string
	ContentType string
	Notes       string
}

type CreateProjectPhaseInput struct {
	ProjectID   string
	Name        string
	Description string
	Objective   string
	StartsOn    *time.Time
	EndsOn      *time.Time
	Position    int
	Active      bool
	Files       []CreateProjectFileInput
}

type UpdateProjectPhaseInput struct {
	ID          string
	ProjectID   string
	Name        string
	Description string
	Objective   string
	StartsOn    *time.Time
	EndsOn      *time.Time
	Position    int
	Active      bool
}

type CreateProjectTaskInput struct {
	ProjectID         string
	ProjectPhaseID    string
	ResponsibleUserID string
	Name              string
	Description       string
	Objective         string
	StartsOn          *time.Time
	EndsOn            *time.Time
	Position          int
	Status            string
	Active            bool
	Files             []CreateProjectFileInput
}

type UpdateProjectTaskInput struct {
	ID                string
	ProjectID         string
	ProjectPhaseID    string
	ResponsibleUserID string
	Name              string
	Description       string
	Objective         string
	StartsOn          *time.Time
	EndsOn            *time.Time
	Position          int
	Status            string
	Active            bool
}

type CreateProjectTaskCommentInput struct {
	ProjectID       string
	ProjectTaskID   string
	ParentCommentID string
	AuthorUserID    string
	AuthorClientID  string
	Comment         string
	Files           []CreateProjectFileInput
}

func (s *ProjectService) ListProjects(
	ctx context.Context,
	filter ProjectListFilter,
) ([]ProjectListItem, error) {
	normalizedFilter := ProjectListFilter{
		Search:     strings.TrimSpace(filter.Search),
		OnlyActive: filter.OnlyActive,
	}

	return s.repo.ListProjects(ctx, normalizedFilter)
}

func (s *ProjectService) GetProjectDetail(
	ctx context.Context,
	projectID string,
) (ProjectDetail, error) {
	id := strings.TrimSpace(projectID)
	if id == "" {
		return ProjectDetail{}, ErrInvalidInput
	}

	return s.repo.GetProjectDetail(ctx, id)
}

func (s *ProjectService) CreateProject(
	ctx context.Context,
	input CreateProjectInput,
) (ProjectDetail, error) {
	normalizedInput, err := normalizeCreateProjectInput(input)
	if err != nil {
		return ProjectDetail{}, err
	}

	return s.repo.CreateProject(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProject(
	ctx context.Context,
	input UpdateProjectInput,
) (ProjectDetail, error) {
	normalizedInput, err := normalizeUpdateProjectInput(input)
	if err != nil {
		return ProjectDetail{}, err
	}

	return s.repo.UpdateProject(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectStatus(
	ctx context.Context,
	input UpdateProjectStatusInput,
) (ProjectDetail, error) {
	normalizedInput, err := normalizeUpdateProjectStatusInput(input)
	if err != nil {
		return ProjectDetail{}, err
	}

	return s.repo.UpdateProjectStatus(ctx, normalizedInput)
}

func (s *ProjectService) DeleteProject(
	ctx context.Context,
	projectID string,
) error {
	id := strings.TrimSpace(projectID)
	if id == "" {
		return ErrInvalidInput
	}

	return s.repo.DeleteProject(ctx, id)
}

func (s *ProjectService) ListProjectCategories(
	ctx context.Context,
) ([]ProjectCategory, error) {
	return s.repo.ListProjectCategories(ctx)
}

func (s *ProjectService) ListProjectTypes(
	ctx context.Context,
	filter ProjectTypeListFilter,
) ([]ProjectType, error) {
	normalizedFilter := ProjectTypeListFilter{
		CategoryID: strings.TrimSpace(filter.CategoryID),
		OnlyActive: filter.OnlyActive,
	}

	return s.repo.ListProjectTypes(ctx, normalizedFilter)
}

func (s *ProjectService) CreateProjectType(
	ctx context.Context,
	input CreateProjectTypeInput,
) (ProjectType, error) {
	normalizedInput := CreateProjectTypeInput{
		CategoryID:  strings.TrimSpace(input.CategoryID),
		Code:        strings.ToLower(strings.TrimSpace(input.Code)),
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Active:      input.Active,
	}
	if normalizedInput.CategoryID == "" ||
		normalizedInput.Code == "" ||
		normalizedInput.Name == "" {
		return ProjectType{}, ErrInvalidInput
	}

	return s.repo.CreateProjectType(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectType(
	ctx context.Context,
	input UpdateProjectTypeInput,
) (ProjectType, error) {
	normalizedInput := UpdateProjectTypeInput{
		ID:          strings.TrimSpace(input.ID),
		CategoryID:  strings.TrimSpace(input.CategoryID),
		Code:        strings.ToLower(strings.TrimSpace(input.Code)),
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Active:      input.Active,
	}
	if normalizedInput.ID == "" ||
		normalizedInput.CategoryID == "" ||
		normalizedInput.Code == "" ||
		normalizedInput.Name == "" {
		return ProjectType{}, ErrInvalidInput
	}

	return s.repo.UpdateProjectType(ctx, normalizedInput)
}

func (s *ProjectService) ListProjectRevenues(
	ctx context.Context,
	projectID string,
) ([]ProjectRevenue, error) {
	id := strings.TrimSpace(projectID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListProjectRevenues(ctx, id)
}

func (s *ProjectService) CreateProjectRevenue(
	ctx context.Context,
	input CreateProjectRevenueInput,
) (ProjectRevenue, error) {
	normalizedInput, err := normalizeCreateProjectRevenueInput(input)
	if err != nil {
		return ProjectRevenue{}, err
	}

	return s.repo.CreateProjectRevenue(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectRevenueStatus(
	ctx context.Context,
	input UpdateProjectRevenueStatusInput,
) error {
	normalizedInput, err := normalizeUpdateProjectRevenueStatusInput(input)
	if err != nil {
		return err
	}

	return s.repo.UpdateProjectRevenueStatus(ctx, normalizedInput)
}

func (s *ProjectService) ListProjectMonthlyCharges(
	ctx context.Context,
	projectID string,
) ([]ProjectMonthlyCharge, error) {
	id := strings.TrimSpace(projectID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListProjectMonthlyCharges(ctx, id)
}

func (s *ProjectService) CreateProjectMonthlyCharge(
	ctx context.Context,
	input CreateProjectMonthlyChargeInput,
) (ProjectMonthlyCharge, error) {
	normalizedInput, err := normalizeCreateProjectMonthlyChargeInput(input)
	if err != nil {
		return ProjectMonthlyCharge{}, err
	}

	return s.repo.CreateProjectMonthlyCharge(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectMonthlyCharge(
	ctx context.Context,
	input UpdateProjectMonthlyChargeInput,
) (ProjectMonthlyCharge, error) {
	normalizedInput, err := normalizeUpdateProjectMonthlyChargeInput(input)
	if err != nil {
		return ProjectMonthlyCharge{}, err
	}

	return s.repo.UpdateProjectMonthlyCharge(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectMonthlyChargeStatus(
	ctx context.Context,
	input UpdateProjectMonthlyChargeStatusInput,
) (ProjectMonthlyCharge, error) {
	normalizedInput, err := normalizeUpdateProjectMonthlyChargeStatusInput(input)
	if err != nil {
		return ProjectMonthlyCharge{}, err
	}

	return s.repo.UpdateProjectMonthlyChargeStatus(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectMonthlyChargeAmount(
	ctx context.Context,
	input UpdateProjectMonthlyChargeAmountInput,
) (ProjectMonthlyCharge, error) {
	normalizedInput, err := normalizeUpdateProjectMonthlyChargeAmountInput(input)
	if err != nil {
		return ProjectMonthlyCharge{}, err
	}

	return s.repo.UpdateProjectMonthlyChargeAmount(ctx, normalizedInput)
}

func (s *ProjectService) DeleteProjectMonthlyCharge(
	ctx context.Context,
	projectID string,
	monthlyChargeID string,
) error {
	normalizedProjectID := strings.TrimSpace(projectID)
	normalizedMonthlyChargeID := strings.TrimSpace(monthlyChargeID)
	if normalizedProjectID == "" || normalizedMonthlyChargeID == "" {
		return ErrInvalidInput
	}

	return s.repo.DeleteProjectMonthlyCharge(ctx, normalizedProjectID, normalizedMonthlyChargeID)
}

func (s *ProjectService) ListProjectPhases(
	ctx context.Context,
	projectID string,
) ([]ProjectPhase, error) {
	id := strings.TrimSpace(projectID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListProjectPhases(ctx, id)
}

func (s *ProjectService) CreateProjectPhase(
	ctx context.Context,
	input CreateProjectPhaseInput,
) (ProjectPhase, error) {
	normalizedInput, err := normalizeCreateProjectPhaseInput(input)
	if err != nil {
		return ProjectPhase{}, err
	}

	return s.repo.CreateProjectPhase(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectPhase(
	ctx context.Context,
	input UpdateProjectPhaseInput,
) (ProjectPhase, error) {
	normalizedInput, err := normalizeUpdateProjectPhaseInput(input)
	if err != nil {
		return ProjectPhase{}, err
	}

	return s.repo.UpdateProjectPhase(ctx, normalizedInput)
}

func (s *ProjectService) ListProjectTasks(
	ctx context.Context,
	projectID string,
) ([]ProjectTask, error) {
	id := strings.TrimSpace(projectID)
	if id == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListProjectTasks(ctx, id)
}

func (s *ProjectService) CreateProjectTask(
	ctx context.Context,
	input CreateProjectTaskInput,
) (ProjectTask, error) {
	normalizedInput, err := normalizeCreateProjectTaskInput(input)
	if err != nil {
		return ProjectTask{}, err
	}

	return s.repo.CreateProjectTask(ctx, normalizedInput)
}

func (s *ProjectService) UpdateProjectTask(
	ctx context.Context,
	input UpdateProjectTaskInput,
) (ProjectTask, error) {
	normalizedInput, err := normalizeUpdateProjectTaskInput(input)
	if err != nil {
		return ProjectTask{}, err
	}

	return s.repo.UpdateProjectTask(ctx, normalizedInput)
}

func (s *ProjectService) ListProjectTaskComments(
	ctx context.Context,
	projectID string,
	taskID string,
) ([]ProjectTaskComment, error) {
	normalizedProjectID := strings.TrimSpace(projectID)
	normalizedTaskID := strings.TrimSpace(taskID)
	if normalizedProjectID == "" || normalizedTaskID == "" {
		return nil, ErrInvalidInput
	}

	return s.repo.ListProjectTaskComments(ctx, normalizedProjectID, normalizedTaskID)
}

func (s *ProjectService) CreateProjectTaskComment(
	ctx context.Context,
	input CreateProjectTaskCommentInput,
) (ProjectTaskComment, error) {
	normalizedInput, err := normalizeCreateProjectTaskCommentInput(input)
	if err != nil {
		return ProjectTaskComment{}, err
	}

	return s.repo.CreateProjectTaskComment(ctx, normalizedInput)
}

func (s *ProjectService) RecalculateProjectTimeline(
	ctx context.Context,
	projectID string,
) (ProjectDetail, error) {
	id := strings.TrimSpace(projectID)
	if id == "" {
		return ProjectDetail{}, ErrInvalidInput
	}

	return s.repo.RecalculateProjectTimeline(ctx, id)
}

func normalizeCreateProjectInput(input CreateProjectInput) (CreateProjectInput, error) {
	normalizedInput := CreateProjectInput{
		Name:                  strings.TrimSpace(input.Name),
		Objective:             strings.TrimSpace(input.Objective),
		ProjectTypeID:         strings.TrimSpace(input.ProjectTypeID),
		LifecycleType:         normalizeProjectLifecycleType(input.LifecycleType),
		HasMonthlyMaintenance: input.HasMonthlyMaintenance,
		StartDate:             input.StartDate,
		EndDate:               input.EndDate,
		Active:                input.Active,
		ClientIDs:             uniqueTrimmedIDs(input.ClientIDs),
		ManagerUserIDs:        uniqueTrimmedIDs(input.ManagerUserIDs),
	}
	if normalizedInput.Name == "" {
		return CreateProjectInput{}, ErrInvalidInput
	}
	if _, ok := allowedProjectLifecycleTypes[normalizedInput.LifecycleType]; !ok {
		return CreateProjectInput{}, ErrInvalidInput
	}
	if normalizedInput.StartDate != nil &&
		normalizedInput.EndDate != nil &&
		normalizedInput.EndDate.Before(*normalizedInput.StartDate) {
		return CreateProjectInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectInput(input UpdateProjectInput) (UpdateProjectInput, error) {
	normalizedInput := UpdateProjectInput{
		ID:                    strings.TrimSpace(input.ID),
		Name:                  strings.TrimSpace(input.Name),
		Objective:             strings.TrimSpace(input.Objective),
		ProjectTypeID:         strings.TrimSpace(input.ProjectTypeID),
		LifecycleType:         normalizeProjectLifecycleType(input.LifecycleType),
		HasMonthlyMaintenance: input.HasMonthlyMaintenance,
		StartDate:             input.StartDate,
		EndDate:               input.EndDate,
		Active:                input.Active,
		ClientIDs:             nil,
		ManagerUserIDs:        nil,
	}
	if input.ClientIDs != nil {
		normalizedIDs := uniqueTrimmedIDs(*input.ClientIDs)
		normalizedInput.ClientIDs = &normalizedIDs
	}
	if input.ManagerUserIDs != nil {
		normalizedIDs := uniqueTrimmedIDs(*input.ManagerUserIDs)
		normalizedInput.ManagerUserIDs = &normalizedIDs
	}
	if normalizedInput.ID == "" || normalizedInput.Name == "" {
		return UpdateProjectInput{}, ErrInvalidInput
	}
	if _, ok := allowedProjectLifecycleTypes[normalizedInput.LifecycleType]; !ok {
		return UpdateProjectInput{}, ErrInvalidInput
	}
	if normalizedInput.StartDate != nil &&
		normalizedInput.EndDate != nil &&
		normalizedInput.EndDate.Before(*normalizedInput.StartDate) {
		return UpdateProjectInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectStatusInput(
	input UpdateProjectStatusInput,
) (UpdateProjectStatusInput, error) {
	normalizedInput := UpdateProjectStatusInput{
		ID:     strings.TrimSpace(input.ID),
		Status: normalizeProjectStatus(input.Status),
	}
	if normalizedInput.ID == "" || normalizedInput.Status == "" {
		return UpdateProjectStatusInput{}, ErrInvalidInput
	}
	if _, ok := allowedProjectStatuses[normalizedInput.Status]; !ok {
		return UpdateProjectStatusInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeCreateProjectRevenueInput(
	input CreateProjectRevenueInput,
) (CreateProjectRevenueInput, error) {
	status := strings.ToLower(strings.TrimSpace(input.Status))
	if status == "" {
		status = "pendente"
	}

	normalizedReceipts := make([]CreateProjectRevenueReceiptInput, 0, len(input.Receipts))
	for _, receipt := range input.Receipts {
		normalizedReceipts = append(normalizedReceipts, CreateProjectRevenueReceiptInput{
			FileName:    strings.TrimSpace(receipt.FileName),
			FileKey:     strings.TrimSpace(receipt.FileKey),
			ContentType: strings.TrimSpace(receipt.ContentType),
			IssuedOn:    receipt.IssuedOn,
			Notes:       strings.TrimSpace(receipt.Notes),
		})
	}

	normalizedInput := CreateProjectRevenueInput{
		ProjectID:   strings.TrimSpace(input.ProjectID),
		Title:       strings.TrimSpace(input.Title),
		Description: strings.TrimSpace(input.Description),
		Objective:   strings.TrimSpace(input.Objective),
		Amount:      input.Amount,
		ExpectedOn:  input.ExpectedOn,
		ReceivedOn:  input.ReceivedOn,
		Status:      status,
		Active:      input.Active,
		Receipts:    normalizedReceipts,
	}
	if normalizedInput.ProjectID == "" || normalizedInput.Title == "" {
		return CreateProjectRevenueInput{}, ErrInvalidInput
	}
	if normalizedInput.Amount < 0 {
		return CreateProjectRevenueInput{}, ErrInvalidInput
	}
	if _, ok := allowedProjectRevenueStatuses[normalizedInput.Status]; !ok {
		return CreateProjectRevenueInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectRevenueStatusInput(
	input UpdateProjectRevenueStatusInput,
) (UpdateProjectRevenueStatusInput, error) {
	normalizedInput := UpdateProjectRevenueStatusInput{
		ID:        strings.TrimSpace(input.ID),
		ProjectID: strings.TrimSpace(input.ProjectID),
		Status:    strings.ToLower(strings.TrimSpace(input.Status)),
	}
	if normalizedInput.ID == "" || normalizedInput.ProjectID == "" || normalizedInput.Status == "" {
		return UpdateProjectRevenueStatusInput{}, ErrInvalidInput
	}
	if _, ok := allowedProjectRevenueStatuses[normalizedInput.Status]; !ok {
		return UpdateProjectRevenueStatusInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeCreateProjectMonthlyChargeInput(
	input CreateProjectMonthlyChargeInput,
) (CreateProjectMonthlyChargeInput, error) {
	dueDay := input.DueDay
	if dueDay == 0 {
		dueDay = 1
	}
	status := normalizeProjectMonthlyChargeStatus(input.Status)
	if status == "" {
		return CreateProjectMonthlyChargeInput{}, ErrInvalidInput
	}

	normalizedInput := CreateProjectMonthlyChargeInput{
		ProjectID:   strings.TrimSpace(input.ProjectID),
		Title:       strings.TrimSpace(input.Title),
		Description: strings.TrimSpace(input.Description),
		Installment: strings.TrimSpace(input.Installment),
		Status:      status,
		Amount:      input.Amount,
		DueDay:      dueDay,
		StartsOn:    input.StartsOn,
		EndsOn:      input.EndsOn,
		Active:      input.Active,
	}
	if normalizedInput.ProjectID == "" || normalizedInput.Title == "" {
		return CreateProjectMonthlyChargeInput{}, ErrInvalidInput
	}
	if normalizedInput.Amount < 0 ||
		normalizedInput.DueDay < 1 ||
		normalizedInput.DueDay > 31 {
		return CreateProjectMonthlyChargeInput{}, ErrInvalidInput
	}
	if normalizedInput.StartsOn != nil &&
		normalizedInput.EndsOn != nil &&
		normalizedInput.EndsOn.Before(*normalizedInput.StartsOn) {
		return CreateProjectMonthlyChargeInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectMonthlyChargeAmountInput(
	input UpdateProjectMonthlyChargeAmountInput,
) (UpdateProjectMonthlyChargeAmountInput, error) {
	normalizedInput := UpdateProjectMonthlyChargeAmountInput{
		ID:        strings.TrimSpace(input.ID),
		ProjectID: strings.TrimSpace(input.ProjectID),
		Amount:    input.Amount,
	}
	if normalizedInput.ID == "" || normalizedInput.ProjectID == "" {
		return UpdateProjectMonthlyChargeAmountInput{}, ErrInvalidInput
	}
	if normalizedInput.Amount < 0 {
		return UpdateProjectMonthlyChargeAmountInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectMonthlyChargeInput(
	input UpdateProjectMonthlyChargeInput,
) (UpdateProjectMonthlyChargeInput, error) {
	status := normalizeProjectMonthlyChargeStatus(input.Status)
	if status == "" {
		return UpdateProjectMonthlyChargeInput{}, ErrInvalidInput
	}

	normalizedInput := UpdateProjectMonthlyChargeInput{
		ID:          strings.TrimSpace(input.ID),
		ProjectID:   strings.TrimSpace(input.ProjectID),
		Title:       strings.TrimSpace(input.Title),
		Description: strings.TrimSpace(input.Description),
		Installment: strings.TrimSpace(input.Installment),
		Status:      status,
		Amount:      input.Amount,
		DueDay:      input.DueDay,
		StartsOn:    input.StartsOn,
		EndsOn:      input.EndsOn,
		Active:      input.Active,
	}
	if normalizedInput.ID == "" ||
		normalizedInput.ProjectID == "" ||
		normalizedInput.Title == "" {
		return UpdateProjectMonthlyChargeInput{}, ErrInvalidInput
	}
	if normalizedInput.Amount < 0 ||
		normalizedInput.DueDay < 1 ||
		normalizedInput.DueDay > 31 {
		return UpdateProjectMonthlyChargeInput{}, ErrInvalidInput
	}
	if normalizedInput.StartsOn != nil &&
		normalizedInput.EndsOn != nil &&
		normalizedInput.EndsOn.Before(*normalizedInput.StartsOn) {
		return UpdateProjectMonthlyChargeInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectMonthlyChargeStatusInput(
	input UpdateProjectMonthlyChargeStatusInput,
) (UpdateProjectMonthlyChargeStatusInput, error) {
	status := normalizeProjectMonthlyChargeStatus(input.Status)
	normalizedInput := UpdateProjectMonthlyChargeStatusInput{
		ID:        strings.TrimSpace(input.ID),
		ProjectID: strings.TrimSpace(input.ProjectID),
		Status:    status,
	}
	if normalizedInput.ID == "" || normalizedInput.ProjectID == "" || normalizedInput.Status == "" {
		return UpdateProjectMonthlyChargeStatusInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeProjectMonthlyChargeStatus(value string) string {
	normalizedValue := strings.ToLower(strings.TrimSpace(value))
	if normalizedValue == "" {
		normalizedValue = "pendente"
	}
	if _, ok := allowedProjectMonthlyChargeStatuses[normalizedValue]; !ok {
		return ""
	}

	return normalizedValue
}

func normalizeCreateProjectPhaseInput(
	input CreateProjectPhaseInput,
) (CreateProjectPhaseInput, error) {
	normalizedInput := CreateProjectPhaseInput{
		ProjectID:   strings.TrimSpace(input.ProjectID),
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Objective:   strings.TrimSpace(input.Objective),
		StartsOn:    input.StartsOn,
		EndsOn:      input.EndsOn,
		Position:    input.Position,
		Active:      input.Active,
		Files:       normalizeProjectFileInputs(input.Files),
	}
	if normalizedInput.ProjectID == "" || normalizedInput.Name == "" {
		return CreateProjectPhaseInput{}, ErrInvalidInput
	}
	if normalizedInput.StartsOn != nil &&
		normalizedInput.EndsOn != nil &&
		normalizedInput.EndsOn.Before(*normalizedInput.StartsOn) {
		return CreateProjectPhaseInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectPhaseInput(
	input UpdateProjectPhaseInput,
) (UpdateProjectPhaseInput, error) {
	normalizedInput := UpdateProjectPhaseInput{
		ID:          strings.TrimSpace(input.ID),
		ProjectID:   strings.TrimSpace(input.ProjectID),
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Objective:   strings.TrimSpace(input.Objective),
		StartsOn:    input.StartsOn,
		EndsOn:      input.EndsOn,
		Position:    input.Position,
		Active:      input.Active,
	}
	if normalizedInput.ID == "" ||
		normalizedInput.ProjectID == "" ||
		normalizedInput.Name == "" {
		return UpdateProjectPhaseInput{}, ErrInvalidInput
	}
	if normalizedInput.StartsOn != nil &&
		normalizedInput.EndsOn != nil &&
		normalizedInput.EndsOn.Before(*normalizedInput.StartsOn) {
		return UpdateProjectPhaseInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeCreateProjectTaskInput(
	input CreateProjectTaskInput,
) (CreateProjectTaskInput, error) {
	status := normalizeProjectTaskStatus(input.Status)

	normalizedInput := CreateProjectTaskInput{
		ProjectID:         strings.TrimSpace(input.ProjectID),
		ProjectPhaseID:    strings.TrimSpace(input.ProjectPhaseID),
		ResponsibleUserID: strings.TrimSpace(input.ResponsibleUserID),
		Name:              strings.TrimSpace(input.Name),
		Description:       strings.TrimSpace(input.Description),
		Objective:         strings.TrimSpace(input.Objective),
		StartsOn:          input.StartsOn,
		EndsOn:            input.EndsOn,
		Position:          input.Position,
		Status:            status,
		Active:            input.Active,
		Files:             normalizeProjectFileInputs(input.Files),
	}
	if normalizedInput.ProjectID == "" || normalizedInput.Name == "" {
		return CreateProjectTaskInput{}, ErrInvalidInput
	}
	if _, ok := allowedProjectTaskStatuses[normalizedInput.Status]; !ok {
		return CreateProjectTaskInput{}, ErrInvalidInput
	}
	if normalizedInput.StartsOn != nil &&
		normalizedInput.EndsOn != nil &&
		normalizedInput.EndsOn.Before(*normalizedInput.StartsOn) {
		return CreateProjectTaskInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateProjectTaskInput(
	input UpdateProjectTaskInput,
) (UpdateProjectTaskInput, error) {
	status := normalizeProjectTaskStatus(input.Status)

	normalizedInput := UpdateProjectTaskInput{
		ID:                strings.TrimSpace(input.ID),
		ProjectID:         strings.TrimSpace(input.ProjectID),
		ProjectPhaseID:    strings.TrimSpace(input.ProjectPhaseID),
		ResponsibleUserID: strings.TrimSpace(input.ResponsibleUserID),
		Name:              strings.TrimSpace(input.Name),
		Description:       strings.TrimSpace(input.Description),
		Objective:         strings.TrimSpace(input.Objective),
		StartsOn:          input.StartsOn,
		EndsOn:            input.EndsOn,
		Position:          input.Position,
		Status:            status,
		Active:            input.Active,
	}
	if normalizedInput.ID == "" || normalizedInput.ProjectID == "" || normalizedInput.Name == "" {
		return UpdateProjectTaskInput{}, ErrInvalidInput
	}
	if _, ok := allowedProjectTaskStatuses[normalizedInput.Status]; !ok {
		return UpdateProjectTaskInput{}, ErrInvalidInput
	}
	if normalizedInput.StartsOn != nil &&
		normalizedInput.EndsOn != nil &&
		normalizedInput.EndsOn.Before(*normalizedInput.StartsOn) {
		return UpdateProjectTaskInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeCreateProjectTaskCommentInput(
	input CreateProjectTaskCommentInput,
) (CreateProjectTaskCommentInput, error) {
	normalizedInput := CreateProjectTaskCommentInput{
		ProjectID:       strings.TrimSpace(input.ProjectID),
		ProjectTaskID:   strings.TrimSpace(input.ProjectTaskID),
		ParentCommentID: strings.TrimSpace(input.ParentCommentID),
		AuthorUserID:    strings.TrimSpace(input.AuthorUserID),
		AuthorClientID:  strings.TrimSpace(input.AuthorClientID),
		Comment:         strings.TrimSpace(input.Comment),
		Files:           normalizeProjectFileInputs(input.Files),
	}
	if normalizedInput.ProjectID == "" ||
		normalizedInput.ProjectTaskID == "" ||
		normalizedInput.Comment == "" {
		return CreateProjectTaskCommentInput{}, ErrInvalidInput
	}
	if normalizedInput.AuthorUserID == "" && normalizedInput.AuthorClientID == "" {
		return CreateProjectTaskCommentInput{}, ErrInvalidInput
	}
	if normalizedInput.AuthorUserID != "" && normalizedInput.AuthorClientID != "" {
		return CreateProjectTaskCommentInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeProjectFileInputs(files []CreateProjectFileInput) []CreateProjectFileInput {
	normalized := make([]CreateProjectFileInput, 0, len(files))
	for _, file := range files {
		normalized = append(normalized, CreateProjectFileInput{
			FileName:    strings.TrimSpace(file.FileName),
			FileKey:     strings.TrimSpace(file.FileKey),
			ContentType: strings.TrimSpace(file.ContentType),
			Notes:       strings.TrimSpace(file.Notes),
		})
	}

	return normalized
}

func normalizeProjectLifecycleType(value string) string {
	lifecycleType := strings.ToLower(strings.TrimSpace(value))
	if lifecycleType == "" {
		return "temporario"
	}

	return lifecycleType
}

func normalizeProjectStatus(value string) string {
	status := strings.ToLower(strings.TrimSpace(value))
	switch status {
	case "concluida":
		return "concluido"
	case "cancelada":
		return "cancelado"
	case "em_andamento", "em andamento":
		return "andamento"
	case "planejado", "planejada":
		return "planejamento"
	default:
		return status
	}
}

func normalizeProjectTaskStatus(value string) string {
	status := strings.ToLower(strings.TrimSpace(value))
	switch status {
	case "", "pendente":
		return "planejada"
	case "em_andamento":
		return "iniciada"
	default:
		return status
	}
}
