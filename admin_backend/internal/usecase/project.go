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

type ProjectRepository interface {
	ListProjects(ctx context.Context, filter ProjectListFilter) ([]ProjectListItem, error)
	GetProjectDetail(ctx context.Context, projectID string) (ProjectDetail, error)
	CreateProject(ctx context.Context, input CreateProjectInput) (ProjectDetail, error)
	UpdateProject(ctx context.Context, input UpdateProjectInput) (ProjectDetail, error)
	DeleteProject(ctx context.Context, projectID string) error
	RecalculateProjectTimeline(ctx context.Context, projectID string) (ProjectDetail, error)

	ListProjectCategories(ctx context.Context) ([]ProjectCategory, error)
	ListProjectTypes(ctx context.Context, filter ProjectTypeListFilter) ([]ProjectType, error)
	CreateProjectType(ctx context.Context, input CreateProjectTypeInput) (ProjectType, error)
	UpdateProjectType(ctx context.Context, input UpdateProjectTypeInput) (ProjectType, error)

	ListProjectRevenues(ctx context.Context, projectID string) ([]ProjectRevenue, error)
	CreateProjectRevenue(ctx context.Context, input CreateProjectRevenueInput) (ProjectRevenue, error)

	ListProjectMonthlyCharges(ctx context.Context, projectID string) ([]ProjectMonthlyCharge, error)
	CreateProjectMonthlyCharge(ctx context.Context, input CreateProjectMonthlyChargeInput) (ProjectMonthlyCharge, error)

	ListProjectPhases(ctx context.Context, projectID string) ([]ProjectPhase, error)
	CreateProjectPhase(ctx context.Context, input CreateProjectPhaseInput) (ProjectPhase, error)
	UpdateProjectPhase(ctx context.Context, input UpdateProjectPhaseInput) (ProjectPhase, error)

	ListProjectTasks(ctx context.Context, projectID string) ([]ProjectTask, error)
	CreateProjectTask(ctx context.Context, input CreateProjectTaskInput) (ProjectTask, error)
	UpdateProjectTask(ctx context.Context, input UpdateProjectTaskInput) (ProjectTask, error)
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
	ID             string               `json:"id"`
	ProjectID      string               `json:"projectId"`
	ProjectPhaseID string               `json:"projectPhaseId,omitempty"`
	Name           string               `json:"name"`
	Description    string               `json:"description"`
	Objective      string               `json:"objective"`
	StartsOn       *time.Time           `json:"startsOn,omitempty"`
	EndsOn         *time.Time           `json:"endsOn,omitempty"`
	Position       int                  `json:"position"`
	Status         string               `json:"status"`
	Active         bool                 `json:"active"`
	Files          []ProjectRelatedFile `json:"files"`
	Created        time.Time            `json:"created"`
	Updated        time.Time            `json:"updated"`
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
	Active                bool                   `json:"active"`
	Created               time.Time              `json:"created"`
	Updated               time.Time              `json:"updated"`
	Clients               []ProjectClient        `json:"clients"`
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

type CreateProjectMonthlyChargeInput struct {
	ProjectID   string
	Title       string
	Description string
	Amount      float64
	DueDay      int
	StartsOn    *time.Time
	EndsOn      *time.Time
	Active      bool
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
	ProjectID      string
	ProjectPhaseID string
	Name           string
	Description    string
	Objective      string
	StartsOn       *time.Time
	EndsOn         *time.Time
	Position       int
	Status         string
	Active         bool
	Files          []CreateProjectFileInput
}

type UpdateProjectTaskInput struct {
	ID             string
	ProjectID      string
	ProjectPhaseID string
	Name           string
	Description    string
	Objective      string
	StartsOn       *time.Time
	EndsOn         *time.Time
	Position       int
	Status         string
	Active         bool
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
	}
	if input.ClientIDs != nil {
		normalizedIDs := uniqueTrimmedIDs(*input.ClientIDs)
		normalizedInput.ClientIDs = &normalizedIDs
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

func normalizeCreateProjectMonthlyChargeInput(
	input CreateProjectMonthlyChargeInput,
) (CreateProjectMonthlyChargeInput, error) {
	dueDay := input.DueDay
	if dueDay == 0 {
		dueDay = 1
	}

	normalizedInput := CreateProjectMonthlyChargeInput{
		ProjectID:   strings.TrimSpace(input.ProjectID),
		Title:       strings.TrimSpace(input.Title),
		Description: strings.TrimSpace(input.Description),
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
		ProjectID:      strings.TrimSpace(input.ProjectID),
		ProjectPhaseID: strings.TrimSpace(input.ProjectPhaseID),
		Name:           strings.TrimSpace(input.Name),
		Description:    strings.TrimSpace(input.Description),
		Objective:      strings.TrimSpace(input.Objective),
		StartsOn:       input.StartsOn,
		EndsOn:         input.EndsOn,
		Position:       input.Position,
		Status:         status,
		Active:         input.Active,
		Files:          normalizeProjectFileInputs(input.Files),
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
		ID:             strings.TrimSpace(input.ID),
		ProjectID:      strings.TrimSpace(input.ProjectID),
		ProjectPhaseID: strings.TrimSpace(input.ProjectPhaseID),
		Name:           strings.TrimSpace(input.Name),
		Description:    strings.TrimSpace(input.Description),
		Objective:      strings.TrimSpace(input.Objective),
		StartsOn:       input.StartsOn,
		EndsOn:         input.EndsOn,
		Position:       input.Position,
		Status:         status,
		Active:         input.Active,
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
