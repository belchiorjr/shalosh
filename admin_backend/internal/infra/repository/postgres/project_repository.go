package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type ProjectRepository struct {
	db *sqlx.DB
}

func NewProjectRepository(db *sqlx.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

type projectListRecord struct {
	ID                    string     `db:"id"`
	Name                  string     `db:"name"`
	Objective             string     `db:"objective"`
	ProjectTypeID         string     `db:"project_type_id"`
	ProjectTypeName       string     `db:"project_type_name"`
	ProjectCategoryName   string     `db:"project_category_name"`
	LifecycleType         string     `db:"lifecycle_type"`
	HasMonthlyMaintenance bool       `db:"has_monthly_maintenance"`
	StartDate             *time.Time `db:"start_date"`
	EndDate               *time.Time `db:"end_date"`
	Status                string     `db:"status"`
	Active                bool       `db:"active"`
	ClientsCount          int        `db:"clients_count"`
	RevenuesCount         int        `db:"revenues_count"`
	MonthlyChargesCount   int        `db:"monthly_charges_count"`
	PhasesCount           int        `db:"phases_count"`
	TasksCount            int        `db:"tasks_count"`
	Created               time.Time  `db:"created"`
	Updated               time.Time  `db:"updated"`
}

type projectRecord struct {
	ID                    string     `db:"id"`
	Name                  string     `db:"name"`
	Objective             string     `db:"objective"`
	ProjectTypeID         string     `db:"project_type_id"`
	ProjectTypeName       string     `db:"project_type_name"`
	ProjectCategoryName   string     `db:"project_category_name"`
	LifecycleType         string     `db:"lifecycle_type"`
	HasMonthlyMaintenance bool       `db:"has_monthly_maintenance"`
	StartDate             *time.Time `db:"start_date"`
	EndDate               *time.Time `db:"end_date"`
	Status                string     `db:"status"`
	Active                bool       `db:"active"`
	Created               time.Time  `db:"created"`
	Updated               time.Time  `db:"updated"`
}

type projectCategoryRecord struct {
	ID          string    `db:"id"`
	Code        string    `db:"code"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	Active      bool      `db:"active"`
	Created     time.Time `db:"created"`
	Updated     time.Time `db:"updated"`
}

type projectTypeRecord struct {
	ID           string    `db:"id"`
	CategoryID   string    `db:"category_id"`
	CategoryCode string    `db:"category_code"`
	CategoryName string    `db:"category_name"`
	Code         string    `db:"code"`
	Name         string    `db:"name"`
	Description  string    `db:"description"`
	Active       bool      `db:"active"`
	Created      time.Time `db:"created"`
	Updated      time.Time `db:"updated"`
}

type projectClientRecord struct {
	ClientID string `db:"client_id"`
	Name     string `db:"name"`
	Email    string `db:"email"`
	Login    string `db:"login"`
	Role     string `db:"role"`
}

type projectManagerRecord struct {
	UserID string `db:"user_id"`
	Name   string `db:"name"`
	Email  string `db:"email"`
	Login  string `db:"login"`
}

type projectRevenueRecord struct {
	ID          string     `db:"id"`
	ProjectID   string     `db:"project_id"`
	Title       string     `db:"title"`
	Description string     `db:"description"`
	Objective   string     `db:"objective"`
	Amount      float64    `db:"amount"`
	ExpectedOn  *time.Time `db:"expected_on"`
	ReceivedOn  *time.Time `db:"received_on"`
	Status      string     `db:"status"`
	Active      bool       `db:"active"`
	Created     time.Time  `db:"created"`
	Updated     time.Time  `db:"updated"`
}

type projectRevenueReceiptRecord struct {
	ID               string     `db:"id"`
	ProjectRevenueID string     `db:"project_revenue_id"`
	FileName         string     `db:"file_name"`
	FileKey          string     `db:"file_key"`
	ContentType      string     `db:"content_type"`
	IssuedOn         *time.Time `db:"issued_on"`
	Notes            string     `db:"notes"`
	Created          time.Time  `db:"created"`
	Updated          time.Time  `db:"updated"`
}

type projectMonthlyChargeRecord struct {
	ID          string     `db:"id"`
	ProjectID   string     `db:"project_id"`
	Title       string     `db:"title"`
	Description string     `db:"description"`
	Installment string     `db:"installment"`
	Status      string     `db:"status"`
	Amount      float64    `db:"amount"`
	DueDay      int        `db:"due_day"`
	StartsOn    *time.Time `db:"starts_on"`
	EndsOn      *time.Time `db:"ends_on"`
	Active      bool       `db:"active"`
	Created     time.Time  `db:"created"`
	Updated     time.Time  `db:"updated"`
}

type projectPhaseRecord struct {
	ID          string     `db:"id"`
	ProjectID   string     `db:"project_id"`
	Name        string     `db:"name"`
	Description string     `db:"description"`
	Objective   string     `db:"objective"`
	StartsOn    *time.Time `db:"starts_on"`
	EndsOn      *time.Time `db:"ends_on"`
	Position    int        `db:"position"`
	Active      bool       `db:"active"`
	Created     time.Time  `db:"created"`
	Updated     time.Time  `db:"updated"`
}

type projectTaskRecord struct {
	ID                  string     `db:"id"`
	ProjectID           string     `db:"project_id"`
	ProjectPhaseID      string     `db:"project_phase_id"`
	ResponsibleUserID   string     `db:"responsible_user_id"`
	ResponsibleUserName string     `db:"responsible_user_name"`
	Name                string     `db:"name"`
	Description         string     `db:"description"`
	Objective           string     `db:"objective"`
	StartsOn            *time.Time `db:"starts_on"`
	EndsOn              *time.Time `db:"ends_on"`
	Position            int        `db:"position"`
	Status              string     `db:"status"`
	Active              bool       `db:"active"`
	Created             time.Time  `db:"created"`
	Updated             time.Time  `db:"updated"`
}

type projectTaskCommentRecord struct {
	ID                string    `db:"id"`
	ProjectTaskID     string    `db:"project_task_id"`
	ParentCommentID   string    `db:"parent_comment_id"`
	UserID            string    `db:"user_id"`
	ClientID          string    `db:"client_id"`
	AuthorName        string    `db:"author_name"`
	AuthorType        string    `db:"author_type"`
	IsProjectManager  bool      `db:"is_project_manager"`
	IsTaskResponsible bool      `db:"is_task_responsible"`
	Comment           string    `db:"comment"`
	Created           time.Time `db:"created"`
	Updated           time.Time `db:"updated"`
}

type projectRelatedFileRecord struct {
	ID          string    `db:"id"`
	ParentID    string    `db:"parent_id"`
	FileName    string    `db:"file_name"`
	FileKey     string    `db:"file_key"`
	ContentType string    `db:"content_type"`
	Notes       string    `db:"notes"`
	Created     time.Time `db:"created"`
	Updated     time.Time `db:"updated"`
}

const plannerTaskMetaPrefix = "__planner_meta__:"

type plannerTaskMeta struct {
	Kind       string `json:"kind"`
	ParentType string `json:"parentType"`
	ParentID   string `json:"parentId"`
}

type projectTaskTimelineRecord struct {
	ID             string     `db:"id"`
	ProjectPhaseID string     `db:"project_phase_id"`
	Status         string     `db:"status"`
	Objective      string     `db:"objective"`
	StartsOn       *time.Time `db:"starts_on"`
	EndsOn         *time.Time `db:"ends_on"`
}

type projectPhaseTimelineRecord struct {
	ID       string     `db:"id"`
	StartsOn *time.Time `db:"starts_on"`
	EndsOn   *time.Time `db:"ends_on"`
}

func (r *ProjectRepository) ListProjects(
	ctx context.Context,
	filter usecase.ProjectListFilter,
) ([]usecase.ProjectListItem, error) {
	search := strings.TrimSpace(filter.Search)

	query := `
			SELECT
			  project.id,
			  project.name,
			  project.objective,
			  COALESCE(project_type.id::text, '') AS project_type_id,
			  COALESCE(project_type.name, '') AS project_type_name,
			  COALESCE(project_category.name, '') AS project_category_name,
			  project.lifecycle_type,
			  project.has_monthly_maintenance,
			  project.start_date,
			  project.end_date,
			  project.status,
			  project.active,
			  (SELECT COUNT(*)::int FROM project_clients project_client WHERE project_client.project_id = project.id) AS clients_count,
		  (SELECT COUNT(*)::int FROM project_revenues project_revenue WHERE project_revenue.project_id = project.id AND project_revenue.active = TRUE) AS revenues_count,
		  (SELECT COUNT(*)::int FROM project_monthly_charges project_monthly_charge WHERE project_monthly_charge.project_id = project.id AND project_monthly_charge.active = TRUE) AS monthly_charges_count,
		  (SELECT COUNT(*)::int FROM project_phases project_phase WHERE project_phase.project_id = project.id AND project_phase.active = TRUE) AS phases_count,
		  (SELECT COUNT(*)::int FROM project_tasks project_task WHERE project_task.project_id = project.id AND project_task.active = TRUE) AS tasks_count,
		  project.created,
		  project.updated
		FROM projects project
		LEFT JOIN project_types project_type ON project_type.id = project.project_type_id
		LEFT JOIN project_categories project_category ON project_category.id = project_type.category_id
		WHERE (
		  $1 = ''
		  OR LOWER(project.name) LIKE LOWER('%' || $1 || '%')
		  OR LOWER(project.objective) LIKE LOWER('%' || $1 || '%')
		  OR LOWER(COALESCE(project_type.name, '')) LIKE LOWER('%' || $1 || '%')
		  OR LOWER(COALESCE(project_category.name, '')) LIKE LOWER('%' || $1 || '%')
		)
	`

	if filter.OnlyActive {
		query += " AND project.active = TRUE"
	}

	query += " ORDER BY project.created DESC, project.id DESC"

	var records []projectListRecord
	if err := r.db.SelectContext(ctx, &records, query, search); err != nil {
		return nil, err
	}

	items := make([]usecase.ProjectListItem, 0, len(records))
	for _, record := range records {
		items = append(items, usecase.ProjectListItem{
			ID:                    record.ID,
			Name:                  record.Name,
			Objective:             record.Objective,
			ProjectTypeID:         record.ProjectTypeID,
			ProjectTypeName:       record.ProjectTypeName,
			ProjectCategoryName:   record.ProjectCategoryName,
			LifecycleType:         record.LifecycleType,
			HasMonthlyMaintenance: record.HasMonthlyMaintenance,
			StartDate:             record.StartDate,
			EndDate:               record.EndDate,
			Status:                record.Status,
			Active:                record.Active,
			ClientsCount:          record.ClientsCount,
			RevenuesCount:         record.RevenuesCount,
			MonthlyChargesCount:   record.MonthlyChargesCount,
			PhasesCount:           record.PhasesCount,
			TasksCount:            record.TasksCount,
			Created:               record.Created,
			Updated:               record.Updated,
		})
	}

	return items, nil
}

func (r *ProjectRepository) GetProjectDetail(
	ctx context.Context,
	projectID string,
) (usecase.ProjectDetail, error) {
	project, err := r.getProjectRecordByID(ctx, projectID)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}

	clients, err := r.listProjectClients(ctx, projectID)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}

	managers, err := r.listProjectManagers(ctx, projectID)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}

	revenues, err := r.ListProjectRevenues(ctx, projectID)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}

	monthlyCharges, err := r.ListProjectMonthlyCharges(ctx, projectID)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}

	phases, err := r.ListProjectPhases(ctx, projectID)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}

	tasks, err := r.ListProjectTasks(ctx, projectID)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}

	return usecase.ProjectDetail{
		ID:                    project.ID,
		Name:                  project.Name,
		Objective:             project.Objective,
		ProjectTypeID:         project.ProjectTypeID,
		ProjectTypeName:       project.ProjectTypeName,
		ProjectCategoryName:   project.ProjectCategoryName,
		LifecycleType:         project.LifecycleType,
		HasMonthlyMaintenance: project.HasMonthlyMaintenance,
		StartDate:             project.StartDate,
		EndDate:               project.EndDate,
		Status:                project.Status,
		Active:                project.Active,
		Created:               project.Created,
		Updated:               project.Updated,
		Clients:               clients,
		Managers:              managers,
		Revenues:              revenues,
		MonthlyCharges:        monthlyCharges,
		Phases:                phases,
		Tasks:                 tasks,
	}, nil
}

func (r *ProjectRepository) CreateProject(
	ctx context.Context,
	input usecase.CreateProjectInput,
) (usecase.ProjectDetail, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}
	defer tx.Rollback()

	var projectID string
	if err := tx.GetContext(
		ctx,
		&projectID,
		`
		INSERT INTO projects (
		  name,
		  objective,
		  project_type_id,
		  lifecycle_type,
		  has_monthly_maintenance,
		  start_date,
		  end_date,
		  active,
		  created,
		  updated
		)
		VALUES (
		  $1,
		  $2,
		  NULLIF($3, '')::uuid,
		  $4,
		  $5,
		  $6,
		  $7,
		  $8,
		  NOW(),
		  NOW()
		)
		RETURNING id
		`,
		input.Name,
		input.Objective,
		input.ProjectTypeID,
		input.LifecycleType,
		input.HasMonthlyMaintenance,
		input.StartDate,
		input.EndDate,
		input.Active,
	); err != nil {
		return usecase.ProjectDetail{}, mapProjectPersistenceError(err)
	}

	if err := r.replaceProjectClients(ctx, tx, projectID, input.ClientIDs); err != nil {
		return usecase.ProjectDetail{}, err
	}
	if err := r.replaceProjectManagers(ctx, tx, projectID, input.ManagerUserIDs); err != nil {
		return usecase.ProjectDetail{}, err
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectDetail{}, err
	}

	return r.GetProjectDetail(ctx, projectID)
}

func (r *ProjectRepository) UpdateProject(
	ctx context.Context,
	input usecase.UpdateProjectInput,
) (usecase.ProjectDetail, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}
	defer tx.Rollback()

	var exists bool
	if err := tx.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM projects WHERE id = $1)",
		input.ID,
	); err != nil {
		return usecase.ProjectDetail{}, err
	}
	if !exists {
		return usecase.ProjectDetail{}, usecase.ErrNotFound
	}

	if _, err := tx.ExecContext(
		ctx,
		`
		UPDATE projects
		SET name = $1,
		    objective = $2,
		    project_type_id = NULLIF($3, '')::uuid,
		    lifecycle_type = $4,
		    has_monthly_maintenance = $5,
		    start_date = $6,
		    end_date = $7,
		    active = COALESCE($8::boolean, active),
		    updated = NOW()
		WHERE id = $9
		`,
		input.Name,
		input.Objective,
		input.ProjectTypeID,
		input.LifecycleType,
		input.HasMonthlyMaintenance,
		input.StartDate,
		input.EndDate,
		input.Active,
		input.ID,
	); err != nil {
		return usecase.ProjectDetail{}, mapProjectPersistenceError(err)
	}

	if input.ClientIDs != nil {
		if err := r.replaceProjectClients(ctx, tx, input.ID, *input.ClientIDs); err != nil {
			return usecase.ProjectDetail{}, err
		}
	}
	if input.ManagerUserIDs != nil {
		if err := r.replaceProjectManagers(ctx, tx, input.ID, *input.ManagerUserIDs); err != nil {
			return usecase.ProjectDetail{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectDetail{}, err
	}

	return r.GetProjectDetail(ctx, input.ID)
}

func (r *ProjectRepository) UpdateProjectStatus(
	ctx context.Context,
	input usecase.UpdateProjectStatusInput,
) (usecase.ProjectDetail, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}
	defer tx.Rollback()

	var exists bool
	if err := tx.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM projects WHERE id = $1)",
		input.ID,
	); err != nil {
		return usecase.ProjectDetail{}, err
	}
	if !exists {
		return usecase.ProjectDetail{}, usecase.ErrNotFound
	}

	resolvedStatus := input.Status
	if input.Status == "concluido" {
		var hasCompletedTasks bool
		if err := tx.GetContext(
			ctx,
			&hasCompletedTasks,
			`
			SELECT EXISTS (
			  SELECT 1
			  FROM project_tasks task
			  WHERE task.project_id = $1
			    AND task.status = 'concluida'
			)
			`,
			input.ID,
		); err != nil {
			return usecase.ProjectDetail{}, err
		}

		if hasCompletedTasks {
			resolvedStatus = "andamento"
		}
	}

	if _, err := tx.ExecContext(
		ctx,
		`
		UPDATE projects
		SET status = $1,
		    active = CASE WHEN $1 = 'cancelado' THEN FALSE ELSE TRUE END,
		    updated = NOW()
		WHERE id = $2
		`,
		resolvedStatus,
		input.ID,
	); err != nil {
		return usecase.ProjectDetail{}, mapProjectPersistenceError(err)
	}

	if resolvedStatus == "cancelado" {
		if _, err := tx.ExecContext(
			ctx,
			`
			UPDATE project_phases
			SET active = FALSE,
			    updated = NOW()
			WHERE project_id = $1
			`,
			input.ID,
		); err != nil {
			return usecase.ProjectDetail{}, mapProjectPersistenceError(err)
		}

		if _, err := tx.ExecContext(
			ctx,
			`
			UPDATE project_tasks
			SET status = 'cancelada',
			    active = FALSE,
			    updated = NOW()
			WHERE project_id = $1
			`,
			input.ID,
		); err != nil {
			return usecase.ProjectDetail{}, mapProjectPersistenceError(err)
		}
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectDetail{}, err
	}

	return r.GetProjectDetail(ctx, input.ID)
}

func (r *ProjectRepository) DeleteProject(
	ctx context.Context,
	projectID string,
) error {
	result, err := r.db.ExecContext(
		ctx,
		"DELETE FROM projects WHERE id = $1",
		projectID,
	)
	if err != nil {
		return mapProjectPersistenceError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err == nil && rowsAffected == 0 {
		return usecase.ErrNotFound
	}

	return nil
}

func (r *ProjectRepository) ListProjectCategories(
	ctx context.Context,
) ([]usecase.ProjectCategory, error) {
	var records []projectCategoryRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT id, code, name, description, active, created, updated
		FROM project_categories
		ORDER BY name ASC, id ASC
		`,
	); err != nil {
		return nil, err
	}

	categories := make([]usecase.ProjectCategory, 0, len(records))
	for _, record := range records {
		categories = append(categories, usecase.ProjectCategory{
			ID:          record.ID,
			Code:        record.Code,
			Name:        record.Name,
			Description: record.Description,
			Active:      record.Active,
			Created:     record.Created,
			Updated:     record.Updated,
		})
	}

	return categories, nil
}

func (r *ProjectRepository) ListProjectTypes(
	ctx context.Context,
	filter usecase.ProjectTypeListFilter,
) ([]usecase.ProjectType, error) {
	query := `
		SELECT
		  project_type.id,
		  project_type.category_id,
		  project_category.code AS category_code,
		  project_category.name AS category_name,
		  project_type.code,
		  project_type.name,
		  project_type.description,
		  project_type.active,
		  project_type.created,
		  project_type.updated
		FROM project_types project_type
		INNER JOIN project_categories project_category
		  ON project_category.id = project_type.category_id
		WHERE ($1 = '' OR project_type.category_id = NULLIF($1, '')::uuid)
	`
	if filter.OnlyActive {
		query += " AND project_type.active = TRUE"
	}
	query += " ORDER BY project_category.name ASC, project_type.name ASC, project_type.id ASC"

	var records []projectTypeRecord
	if err := r.db.SelectContext(ctx, &records, query, filter.CategoryID); err != nil {
		return nil, err
	}

	types := make([]usecase.ProjectType, 0, len(records))
	for _, record := range records {
		types = append(types, usecase.ProjectType{
			ID:           record.ID,
			CategoryID:   record.CategoryID,
			CategoryCode: record.CategoryCode,
			CategoryName: record.CategoryName,
			Code:         record.Code,
			Name:         record.Name,
			Description:  record.Description,
			Active:       record.Active,
			Created:      record.Created,
			Updated:      record.Updated,
		})
	}

	return types, nil
}

func (r *ProjectRepository) CreateProjectType(
	ctx context.Context,
	input usecase.CreateProjectTypeInput,
) (usecase.ProjectType, error) {
	var projectType usecase.ProjectType
	if err := r.db.GetContext(
		ctx,
		&projectType,
		`
		INSERT INTO project_types (
		  category_id,
		  code,
		  name,
		  description,
		  active,
		  created,
		  updated
		)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING
		  id,
		  category_id,
		  (
		    SELECT code
		    FROM project_categories
		    WHERE id = project_types.category_id
		  ) AS categorycode,
		  (
		    SELECT name
		    FROM project_categories
		    WHERE id = project_types.category_id
		  ) AS categoryname,
		  code,
		  name,
		  description,
		  active,
		  created,
		  updated
		`,
		input.CategoryID,
		input.Code,
		input.Name,
		input.Description,
		input.Active,
	); err != nil {
		return usecase.ProjectType{}, mapProjectPersistenceError(err)
	}

	return projectType, nil
}

func (r *ProjectRepository) UpdateProjectType(
	ctx context.Context,
	input usecase.UpdateProjectTypeInput,
) (usecase.ProjectType, error) {
	var projectType usecase.ProjectType
	if err := r.db.GetContext(
		ctx,
		&projectType,
		`
		UPDATE project_types
		SET category_id = $1,
		    code = $2,
		    name = $3,
		    description = $4,
		    active = COALESCE($5::boolean, active),
		    updated = NOW()
		WHERE id = $6
		RETURNING
		  id,
		  category_id,
		  (
		    SELECT code
		    FROM project_categories
		    WHERE id = project_types.category_id
		  ) AS categorycode,
		  (
		    SELECT name
		    FROM project_categories
		    WHERE id = project_types.category_id
		  ) AS categoryname,
		  code,
		  name,
		  description,
		  active,
		  created,
		  updated
		`,
		input.CategoryID,
		input.Code,
		input.Name,
		input.Description,
		input.Active,
		input.ID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ProjectType{}, usecase.ErrNotFound
		}
		return usecase.ProjectType{}, mapProjectPersistenceError(err)
	}

	return projectType, nil
}

func (r *ProjectRepository) ListProjectRevenues(
	ctx context.Context,
	projectID string,
) ([]usecase.ProjectRevenue, error) {
	exists, err := r.projectExists(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, usecase.ErrNotFound
	}

	records, err := r.listProjectRevenueRecords(ctx, projectID)
	if err != nil {
		return nil, err
	}

	return r.withRevenueReceipts(ctx, records)
}

func (r *ProjectRepository) CreateProjectRevenue(
	ctx context.Context,
	input usecase.CreateProjectRevenueInput,
) (usecase.ProjectRevenue, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectRevenue{}, err
	}
	defer tx.Rollback()

	var revenueID string
	if err := tx.GetContext(
		ctx,
		&revenueID,
		`
		INSERT INTO project_revenues (
		  project_id,
		  title,
		  description,
		  objective,
		  amount,
		  expected_on,
		  received_on,
		  status,
		  active,
		  created,
		  updated
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING id
		`,
		input.ProjectID,
		input.Title,
		input.Description,
		input.Objective,
		input.Amount,
		input.ExpectedOn,
		input.ReceivedOn,
		input.Status,
		input.Active,
	); err != nil {
		return usecase.ProjectRevenue{}, mapProjectPersistenceError(err)
	}

	for _, receipt := range input.Receipts {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO project_revenue_receipts (
			  project_revenue_id,
			  file_name,
			  file_key,
			  content_type,
			  issued_on,
			  notes,
			  created,
			  updated
			)
			VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
			`,
			revenueID,
			receipt.FileName,
			receipt.FileKey,
			receipt.ContentType,
			receipt.IssuedOn,
			receipt.Notes,
		); err != nil {
			return usecase.ProjectRevenue{}, mapProjectPersistenceError(err)
		}
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectRevenue{}, err
	}

	revenues, err := r.ListProjectRevenues(ctx, input.ProjectID)
	if err != nil {
		return usecase.ProjectRevenue{}, err
	}
	for _, revenue := range revenues {
		if revenue.ID == revenueID {
			return revenue, nil
		}
	}

	return usecase.ProjectRevenue{}, usecase.ErrNotFound
}

func (r *ProjectRepository) UpdateProjectRevenueStatus(
	ctx context.Context,
	input usecase.UpdateProjectRevenueStatusInput,
) error {
	result, err := r.db.ExecContext(
		ctx,
		`
		UPDATE project_revenues
		SET status = $1,
		    updated = NOW()
		WHERE id = $2
		  AND project_id = $3
		`,
		input.Status,
		input.ID,
		input.ProjectID,
	)
	if err != nil {
		return mapProjectPersistenceError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return usecase.ErrNotFound
	}

	return nil
}

func (r *ProjectRepository) ListProjectMonthlyCharges(
	ctx context.Context,
	projectID string,
) ([]usecase.ProjectMonthlyCharge, error) {
	exists, err := r.projectExists(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, usecase.ErrNotFound
	}

	var records []projectMonthlyChargeRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
			SELECT
			  id,
			  project_id,
			  title,
			  description,
			  installment,
			  status,
			  amount,
			  due_day,
			  starts_on,
		  ends_on,
		  active,
		  created,
		  updated
		FROM project_monthly_charges
		WHERE project_id = $1
		ORDER BY due_day ASC, created ASC, id ASC
		`,
		projectID,
	); err != nil {
		if !isUndefinedRelationOrColumn(err) {
			return nil, err
		}

		// Fallback para bases antigas sem colunas installment/status.
		if fallbackErr := r.db.SelectContext(
			ctx,
			&records,
			`
			SELECT
			  id,
			  project_id,
			  title,
			  description,
			  '' AS installment,
			  'pendente' AS status,
			  amount,
			  due_day,
			  starts_on,
			  ends_on,
			  active,
			  created,
			  updated
			FROM project_monthly_charges
			WHERE project_id = $1
			ORDER BY due_day ASC, created ASC, id ASC
			`,
			projectID,
		); fallbackErr != nil {
			return nil, fallbackErr
		}
	}

	charges := make([]usecase.ProjectMonthlyCharge, 0, len(records))
	for _, record := range records {
		charges = append(charges, usecase.ProjectMonthlyCharge{
			ID:          record.ID,
			ProjectID:   record.ProjectID,
			Title:       record.Title,
			Description: record.Description,
			Installment: record.Installment,
			Status:      record.Status,
			Amount:      record.Amount,
			DueDay:      record.DueDay,
			StartsOn:    record.StartsOn,
			EndsOn:      record.EndsOn,
			Active:      record.Active,
			Created:     record.Created,
			Updated:     record.Updated,
		})
	}

	return charges, nil
}

func (r *ProjectRepository) CreateProjectMonthlyCharge(
	ctx context.Context,
	input usecase.CreateProjectMonthlyChargeInput,
) (usecase.ProjectMonthlyCharge, error) {
	var chargeRecord projectMonthlyChargeRecord
	if err := r.db.GetContext(
		ctx,
		&chargeRecord,
		`
		INSERT INTO project_monthly_charges (
		  project_id,
		  title,
		  description,
		  installment,
		  status,
		  amount,
		  due_day,
		  starts_on,
		  ends_on,
		  active,
		  created,
		  updated
		)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
			RETURNING
			  id,
			  project_id,
			  title,
			  description,
			  installment,
			  status,
			  amount,
			  due_day,
		  starts_on,
		  ends_on,
		  active,
		  created,
		  updated
		`,
		input.ProjectID,
		input.Title,
		input.Description,
		input.Installment,
		input.Status,
		input.Amount,
		input.DueDay,
		input.StartsOn,
		input.EndsOn,
		input.Active,
	); err != nil {
		return usecase.ProjectMonthlyCharge{}, mapProjectPersistenceError(err)
	}

	return usecase.ProjectMonthlyCharge{
		ID:          chargeRecord.ID,
		ProjectID:   chargeRecord.ProjectID,
		Title:       chargeRecord.Title,
		Description: chargeRecord.Description,
		Installment: chargeRecord.Installment,
		Status:      chargeRecord.Status,
		Amount:      chargeRecord.Amount,
		DueDay:      chargeRecord.DueDay,
		StartsOn:    chargeRecord.StartsOn,
		EndsOn:      chargeRecord.EndsOn,
		Active:      chargeRecord.Active,
		Created:     chargeRecord.Created,
		Updated:     chargeRecord.Updated,
	}, nil
}

func (r *ProjectRepository) UpdateProjectMonthlyCharge(
	ctx context.Context,
	input usecase.UpdateProjectMonthlyChargeInput,
) (usecase.ProjectMonthlyCharge, error) {
	var chargeRecord projectMonthlyChargeRecord
	if err := r.db.GetContext(
		ctx,
		&chargeRecord,
		`
		UPDATE project_monthly_charges
		SET title = $1,
		    description = $2,
		    installment = $3,
		    status = $4,
		    amount = $5,
		    due_day = $6,
		    starts_on = $7,
		    ends_on = $8,
		    active = $9,
		    updated = NOW()
		WHERE id = $10
		  AND project_id = $11
		  AND status = 'pendente'
		RETURNING
		  id,
		  project_id,
		  title,
		  description,
		  installment,
		  status,
		  amount,
		  due_day,
		  starts_on,
		  ends_on,
		  active,
		  created,
		  updated
		`,
		input.Title,
		input.Description,
		input.Installment,
		input.Status,
		input.Amount,
		input.DueDay,
		input.StartsOn,
		input.EndsOn,
		input.Active,
		input.ID,
		input.ProjectID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			exists, existsErr := r.projectMonthlyChargeExists(ctx, input.ID, input.ProjectID)
			if existsErr != nil {
				return usecase.ProjectMonthlyCharge{}, existsErr
			}
			if exists {
				return usecase.ProjectMonthlyCharge{}, usecase.ErrConflict
			}
			return usecase.ProjectMonthlyCharge{}, usecase.ErrNotFound
		}
		return usecase.ProjectMonthlyCharge{}, mapProjectPersistenceError(err)
	}

	return usecase.ProjectMonthlyCharge{
		ID:          chargeRecord.ID,
		ProjectID:   chargeRecord.ProjectID,
		Title:       chargeRecord.Title,
		Description: chargeRecord.Description,
		Installment: chargeRecord.Installment,
		Status:      chargeRecord.Status,
		Amount:      chargeRecord.Amount,
		DueDay:      chargeRecord.DueDay,
		StartsOn:    chargeRecord.StartsOn,
		EndsOn:      chargeRecord.EndsOn,
		Active:      chargeRecord.Active,
		Created:     chargeRecord.Created,
		Updated:     chargeRecord.Updated,
	}, nil
}

func (r *ProjectRepository) UpdateProjectMonthlyChargeStatus(
	ctx context.Context,
	input usecase.UpdateProjectMonthlyChargeStatusInput,
) (usecase.ProjectMonthlyCharge, error) {
	var chargeRecord projectMonthlyChargeRecord
	if err := r.db.GetContext(
		ctx,
		&chargeRecord,
		`
		UPDATE project_monthly_charges
		SET status = $1,
		    updated = NOW()
		WHERE id = $2
		  AND project_id = $3
		  AND status = 'pendente'
		RETURNING
		  id,
		  project_id,
		  title,
		  description,
		  installment,
		  status,
		  amount,
		  due_day,
		  starts_on,
		  ends_on,
		  active,
		  created,
		  updated
		`,
		input.Status,
		input.ID,
		input.ProjectID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			exists, existsErr := r.projectMonthlyChargeExists(ctx, input.ID, input.ProjectID)
			if existsErr != nil {
				return usecase.ProjectMonthlyCharge{}, existsErr
			}
			if exists {
				return usecase.ProjectMonthlyCharge{}, usecase.ErrConflict
			}
			return usecase.ProjectMonthlyCharge{}, usecase.ErrNotFound
		}
		return usecase.ProjectMonthlyCharge{}, mapProjectPersistenceError(err)
	}

	return usecase.ProjectMonthlyCharge{
		ID:          chargeRecord.ID,
		ProjectID:   chargeRecord.ProjectID,
		Title:       chargeRecord.Title,
		Description: chargeRecord.Description,
		Installment: chargeRecord.Installment,
		Status:      chargeRecord.Status,
		Amount:      chargeRecord.Amount,
		DueDay:      chargeRecord.DueDay,
		StartsOn:    chargeRecord.StartsOn,
		EndsOn:      chargeRecord.EndsOn,
		Active:      chargeRecord.Active,
		Created:     chargeRecord.Created,
		Updated:     chargeRecord.Updated,
	}, nil
}

func (r *ProjectRepository) UpdateProjectMonthlyChargeAmount(
	ctx context.Context,
	input usecase.UpdateProjectMonthlyChargeAmountInput,
) (usecase.ProjectMonthlyCharge, error) {
	var chargeRecord projectMonthlyChargeRecord
	if err := r.db.GetContext(
		ctx,
		&chargeRecord,
		`
		UPDATE project_monthly_charges
		SET amount = $1,
		    updated = NOW()
		WHERE id = $2
		  AND project_id = $3
		  AND status = 'pendente'
		RETURNING
		  id,
		  project_id,
		  title,
		  description,
		  installment,
		  status,
		  amount,
		  due_day,
		  starts_on,
		  ends_on,
		  active,
		  created,
		  updated
		`,
		input.Amount,
		input.ID,
		input.ProjectID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			exists, existsErr := r.projectMonthlyChargeExists(ctx, input.ID, input.ProjectID)
			if existsErr != nil {
				return usecase.ProjectMonthlyCharge{}, existsErr
			}
			if exists {
				return usecase.ProjectMonthlyCharge{}, usecase.ErrConflict
			}
			return usecase.ProjectMonthlyCharge{}, usecase.ErrNotFound
		}
		return usecase.ProjectMonthlyCharge{}, mapProjectPersistenceError(err)
	}

	return usecase.ProjectMonthlyCharge{
		ID:          chargeRecord.ID,
		ProjectID:   chargeRecord.ProjectID,
		Title:       chargeRecord.Title,
		Description: chargeRecord.Description,
		Installment: chargeRecord.Installment,
		Status:      chargeRecord.Status,
		Amount:      chargeRecord.Amount,
		DueDay:      chargeRecord.DueDay,
		StartsOn:    chargeRecord.StartsOn,
		EndsOn:      chargeRecord.EndsOn,
		Active:      chargeRecord.Active,
		Created:     chargeRecord.Created,
		Updated:     chargeRecord.Updated,
	}, nil
}

func (r *ProjectRepository) DeleteProjectMonthlyCharge(
	ctx context.Context,
	projectID string,
	monthlyChargeID string,
) error {
	result, err := r.db.ExecContext(
		ctx,
		`
		DELETE FROM project_monthly_charges
		WHERE id = $1
		  AND project_id = $2
		`,
		monthlyChargeID,
		projectID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return usecase.ErrNotFound
	}

	return nil
}

func (r *ProjectRepository) projectMonthlyChargeExists(
	ctx context.Context,
	chargeID string,
	projectID string,
) (bool, error) {
	var exists bool
	if err := r.db.GetContext(
		ctx,
		&exists,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM project_monthly_charges
		  WHERE id = $1
		    AND project_id = $2
		)
		`,
		chargeID,
		projectID,
	); err != nil {
		return false, err
	}

	return exists, nil
}

func (r *ProjectRepository) ListProjectPhases(
	ctx context.Context,
	projectID string,
) ([]usecase.ProjectPhase, error) {
	exists, err := r.projectExists(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, usecase.ErrNotFound
	}

	records, err := r.listProjectPhaseRecords(ctx, projectID)
	if err != nil {
		return nil, err
	}

	return r.withPhaseFiles(ctx, records)
}

func (r *ProjectRepository) CreateProjectPhase(
	ctx context.Context,
	input usecase.CreateProjectPhaseInput,
) (usecase.ProjectPhase, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectPhase{}, err
	}
	defer tx.Rollback()

	var phaseID string
	if err := tx.GetContext(
		ctx,
		&phaseID,
		`
		INSERT INTO project_phases (
		  project_id,
		  name,
		  description,
		  objective,
		  starts_on,
		  ends_on,
		  position,
		  active,
		  created,
		  updated
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id
		`,
		input.ProjectID,
		input.Name,
		input.Description,
		input.Objective,
		input.StartsOn,
		input.EndsOn,
		input.Position,
		input.Active,
	); err != nil {
		return usecase.ProjectPhase{}, mapProjectPersistenceError(err)
	}

	for _, file := range input.Files {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO project_phase_files (
			  project_phase_id,
			  file_name,
			  file_key,
			  content_type,
			  notes,
			  created,
			  updated
			)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			`,
			phaseID,
			file.FileName,
			file.FileKey,
			file.ContentType,
			file.Notes,
		); err != nil {
			return usecase.ProjectPhase{}, mapProjectPersistenceError(err)
		}
	}

	if err := r.recalculateProjectTimeline(ctx, tx, input.ProjectID); err != nil {
		return usecase.ProjectPhase{}, err
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectPhase{}, err
	}

	phases, err := r.ListProjectPhases(ctx, input.ProjectID)
	if err != nil {
		return usecase.ProjectPhase{}, err
	}
	for _, phase := range phases {
		if phase.ID == phaseID {
			return phase, nil
		}
	}

	return usecase.ProjectPhase{}, usecase.ErrNotFound
}

func (r *ProjectRepository) UpdateProjectPhase(
	ctx context.Context,
	input usecase.UpdateProjectPhaseInput,
) (usecase.ProjectPhase, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectPhase{}, err
	}
	defer tx.Rollback()

	var projectExists bool
	if err := tx.GetContext(
		ctx,
		&projectExists,
		"SELECT EXISTS (SELECT 1 FROM projects WHERE id = $1)",
		input.ProjectID,
	); err != nil {
		return usecase.ProjectPhase{}, err
	}
	if !projectExists {
		return usecase.ProjectPhase{}, usecase.ErrNotFound
	}

	var phaseExists bool
	if err := tx.GetContext(
		ctx,
		&phaseExists,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM project_phases
		  WHERE id = $1
		    AND project_id = $2
		)
		`,
		input.ID,
		input.ProjectID,
	); err != nil {
		return usecase.ProjectPhase{}, err
	}
	if !phaseExists {
		return usecase.ProjectPhase{}, usecase.ErrNotFound
	}

	if _, err := tx.ExecContext(
		ctx,
		`
		UPDATE project_phases
		SET
		  name = $1,
		  description = $2,
		  objective = $3,
		  starts_on = $4,
		  ends_on = $5,
		  position = $6,
		  active = $7,
		  updated = NOW()
		WHERE id = $8
		  AND project_id = $9
		`,
		input.Name,
		input.Description,
		input.Objective,
		input.StartsOn,
		input.EndsOn,
		input.Position,
		input.Active,
		input.ID,
		input.ProjectID,
	); err != nil {
		return usecase.ProjectPhase{}, mapProjectPersistenceError(err)
	}

	if err := r.recalculateProjectTimeline(ctx, tx, input.ProjectID); err != nil {
		return usecase.ProjectPhase{}, err
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectPhase{}, err
	}

	phases, err := r.ListProjectPhases(ctx, input.ProjectID)
	if err != nil {
		return usecase.ProjectPhase{}, err
	}
	for _, phase := range phases {
		if phase.ID == input.ID {
			return phase, nil
		}
	}

	return usecase.ProjectPhase{}, usecase.ErrNotFound
}

func (r *ProjectRepository) ListProjectTasks(
	ctx context.Context,
	projectID string,
) ([]usecase.ProjectTask, error) {
	exists, err := r.projectExists(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, usecase.ErrNotFound
	}

	records, err := r.listProjectTaskRecords(ctx, projectID)
	if err != nil {
		return nil, err
	}

	return r.withTaskFiles(ctx, records)
}

func (r *ProjectRepository) CreateProjectTask(
	ctx context.Context,
	input usecase.CreateProjectTaskInput,
) (usecase.ProjectTask, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectTask{}, err
	}
	defer tx.Rollback()

	var taskID string
	if err := tx.GetContext(
		ctx,
		&taskID,
		`
		INSERT INTO project_tasks (
		  project_id,
		  project_phase_id,
		  responsible_user_id,
		  name,
		  description,
		  objective,
		  starts_on,
		  ends_on,
		  position,
		  status,
		  active,
		  created,
		  updated
		)
		VALUES (
		  $1,
		  NULLIF($2, '')::uuid,
		  NULLIF($3, '')::uuid,
		  $4,
		  $5,
		  $6,
			  $7,
			  $8,
			  $9,
			  $10,
			  $11,
			  NOW(),
			  NOW()
			)
		RETURNING id
		`,
		input.ProjectID,
		input.ProjectPhaseID,
		input.ResponsibleUserID,
		input.Name,
		input.Description,
		input.Objective,
		input.StartsOn,
		input.EndsOn,
		input.Position,
		input.Status,
		input.Active,
	); err != nil {
		return usecase.ProjectTask{}, mapProjectPersistenceError(err)
	}

	for _, file := range input.Files {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO project_task_files (
			  project_task_id,
			  file_name,
			  file_key,
			  content_type,
			  notes,
			  created,
			  updated
			)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			`,
			taskID,
			file.FileName,
			file.FileKey,
			file.ContentType,
			file.Notes,
		); err != nil {
			return usecase.ProjectTask{}, mapProjectPersistenceError(err)
		}
	}

	if err := r.recalculateProjectTimeline(ctx, tx, input.ProjectID); err != nil {
		return usecase.ProjectTask{}, err
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectTask{}, err
	}

	tasks, err := r.ListProjectTasks(ctx, input.ProjectID)
	if err != nil {
		return usecase.ProjectTask{}, err
	}
	for _, task := range tasks {
		if task.ID == taskID {
			return task, nil
		}
	}

	return usecase.ProjectTask{}, usecase.ErrNotFound
}

func (r *ProjectRepository) UpdateProjectTask(
	ctx context.Context,
	input usecase.UpdateProjectTaskInput,
) (usecase.ProjectTask, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectTask{}, err
	}
	defer tx.Rollback()

	var exists bool
	if err := tx.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM projects WHERE id = $1)",
		input.ProjectID,
	); err != nil {
		return usecase.ProjectTask{}, err
	}
	if !exists {
		return usecase.ProjectTask{}, usecase.ErrNotFound
	}

	var taskExists bool
	if err := tx.GetContext(
		ctx,
		&taskExists,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM project_tasks
		  WHERE id = $1
		    AND project_id = $2
		)
		`,
		input.ID,
		input.ProjectID,
	); err != nil {
		return usecase.ProjectTask{}, err
	}
	if !taskExists {
		return usecase.ProjectTask{}, usecase.ErrNotFound
	}

	if _, err := tx.ExecContext(
		ctx,
		`
		UPDATE project_tasks
		SET
		  project_phase_id = NULLIF($1, '')::uuid,
		  responsible_user_id = NULLIF($2, '')::uuid,
		  name = $3,
		  description = $4,
		  objective = $5,
		  starts_on = $6,
		  ends_on = $7,
		  position = $8,
		  status = $9,
		  active = $10,
		  updated = NOW()
		WHERE id = $11
		  AND project_id = $12
		`,
		input.ProjectPhaseID,
		input.ResponsibleUserID,
		input.Name,
		input.Description,
		input.Objective,
		input.StartsOn,
		input.EndsOn,
		input.Position,
		input.Status,
		input.Active,
		input.ID,
		input.ProjectID,
	); err != nil {
		return usecase.ProjectTask{}, mapProjectPersistenceError(err)
	}

	if err := r.recalculateProjectTimeline(ctx, tx, input.ProjectID); err != nil {
		return usecase.ProjectTask{}, err
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectTask{}, err
	}

	tasks, err := r.ListProjectTasks(ctx, input.ProjectID)
	if err != nil {
		return usecase.ProjectTask{}, err
	}
	for _, task := range tasks {
		if task.ID == input.ID {
			return task, nil
		}
	}

	return usecase.ProjectTask{}, usecase.ErrNotFound
}

func (r *ProjectRepository) ListProjectTaskComments(
	ctx context.Context,
	projectID string,
	taskID string,
) ([]usecase.ProjectTaskComment, error) {
	var taskExists bool
	if err := r.db.GetContext(
		ctx,
		&taskExists,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM project_tasks
		  WHERE id = $1
		    AND project_id = $2
		)
		`,
		taskID,
		projectID,
	); err != nil {
		return nil, err
	}
	if !taskExists {
		return nil, usecase.ErrNotFound
	}

	records, err := r.listProjectTaskCommentRecords(ctx, taskID)
	if err != nil {
		return nil, err
	}

	return r.withTaskCommentFiles(ctx, records)
}

func (r *ProjectRepository) CreateProjectTaskComment(
	ctx context.Context,
	input usecase.CreateProjectTaskCommentInput,
) (usecase.ProjectTaskComment, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectTaskComment{}, err
	}
	defer tx.Rollback()

	var taskExists bool
	if err := tx.GetContext(
		ctx,
		&taskExists,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM project_tasks
		  WHERE id = $1
		    AND project_id = $2
		)
		`,
		input.ProjectTaskID,
		input.ProjectID,
	); err != nil {
		return usecase.ProjectTaskComment{}, err
	}
	if !taskExists {
		return usecase.ProjectTaskComment{}, usecase.ErrNotFound
	}

	if input.ParentCommentID != "" {
		var parentCommentExists bool
		if err := tx.GetContext(
			ctx,
			&parentCommentExists,
			`
			SELECT EXISTS (
			  SELECT 1
			  FROM project_task_comments
			  WHERE id = $1
			    AND project_task_id = $2
			)
			`,
			input.ParentCommentID,
			input.ProjectTaskID,
		); err != nil {
			return usecase.ProjectTaskComment{}, err
		}
		if !parentCommentExists {
			return usecase.ProjectTaskComment{}, usecase.ErrNotFound
		}
	}

	var commentID string
	if err := tx.GetContext(
		ctx,
		&commentID,
		`
		INSERT INTO project_task_comments (
		  project_task_id,
		  parent_comment_id,
		  user_id,
		  client_id,
		  comment,
		  created,
		  updated
		)
		VALUES (
		  $1,
		  NULLIF($2, '')::uuid,
		  NULLIF($3, '')::uuid,
		  NULLIF($4, '')::uuid,
		  $5,
		  NOW(),
		  NOW()
		)
		RETURNING id
		`,
		input.ProjectTaskID,
		input.ParentCommentID,
		input.AuthorUserID,
		input.AuthorClientID,
		input.Comment,
	); err != nil {
		return usecase.ProjectTaskComment{}, mapProjectPersistenceError(err)
	}

	for _, file := range input.Files {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO project_task_comment_files (
			  project_task_comment_id,
			  file_name,
			  file_key,
			  content_type,
			  notes,
			  created,
			  updated
			)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			`,
			commentID,
			file.FileName,
			file.FileKey,
			file.ContentType,
			file.Notes,
		); err != nil {
			return usecase.ProjectTaskComment{}, mapProjectPersistenceError(err)
		}
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectTaskComment{}, err
	}

	comments, err := r.ListProjectTaskComments(ctx, input.ProjectID, input.ProjectTaskID)
	if err != nil {
		return usecase.ProjectTaskComment{}, err
	}
	for _, comment := range comments {
		if comment.ID == commentID {
			return comment, nil
		}
	}

	return usecase.ProjectTaskComment{}, usecase.ErrNotFound
}

func (r *ProjectRepository) getProjectRecordByID(
	ctx context.Context,
	projectID string,
) (projectRecord, error) {
	var project projectRecord
	if err := r.db.GetContext(
		ctx,
		&project,
		`
			SELECT
			  project.id,
			  project.name,
			  project.objective,
			  COALESCE(project_type.id::text, '') AS project_type_id,
			  COALESCE(project_type.name, '') AS project_type_name,
			  COALESCE(project_category.name, '') AS project_category_name,
			  project.lifecycle_type,
			  project.has_monthly_maintenance,
			  project.start_date,
			  project.end_date,
			  project.status,
			  project.active,
			  project.created,
			  project.updated
		FROM projects project
		LEFT JOIN project_types project_type ON project_type.id = project.project_type_id
		LEFT JOIN project_categories project_category ON project_category.id = project_type.category_id
		WHERE project.id = $1
		LIMIT 1
		`,
		projectID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return projectRecord{}, usecase.ErrNotFound
		}
		return projectRecord{}, err
	}

	return project, nil
}

func (r *ProjectRepository) listProjectClients(
	ctx context.Context,
	projectID string,
) ([]usecase.ProjectClient, error) {
	var records []projectClientRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  project_client.client_id,
		  client.name,
		  client.email,
		  client.login,
		  project_client.role
		FROM project_clients project_client
		INNER JOIN clients client ON client.id = project_client.client_id
		WHERE project_client.project_id = $1
		ORDER BY client.name ASC, client.id ASC
		`,
		projectID,
	); err != nil {
		return nil, err
	}

	clients := make([]usecase.ProjectClient, 0, len(records))
	for _, record := range records {
		clients = append(clients, usecase.ProjectClient{
			ClientID: record.ClientID,
			Name:     record.Name,
			Email:    record.Email,
			Login:    record.Login,
			Role:     record.Role,
		})
	}

	return clients, nil
}

func (r *ProjectRepository) listProjectManagers(
	ctx context.Context,
	projectID string,
) ([]usecase.ProjectManager, error) {
	var records []projectManagerRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  project_manager.user_id,
		  user_record.name,
		  user_record.email,
		  user_record.login
		FROM project_managers project_manager
		INNER JOIN users user_record ON user_record.id = project_manager.user_id
		WHERE project_manager.project_id = $1
		ORDER BY user_record.name ASC, user_record.id ASC
		`,
		projectID,
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return []usecase.ProjectManager{}, nil
		}
		return nil, err
	}

	managers := make([]usecase.ProjectManager, 0, len(records))
	for _, record := range records {
		managers = append(managers, usecase.ProjectManager{
			UserID: record.UserID,
			Name:   record.Name,
			Email:  record.Email,
			Login:  record.Login,
		})
	}

	return managers, nil
}

func (r *ProjectRepository) listProjectRevenueRecords(
	ctx context.Context,
	projectID string,
) ([]projectRevenueRecord, error) {
	var records []projectRevenueRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  id,
		  project_id,
		  title,
		  description,
		  objective,
		  amount,
		  expected_on,
		  received_on,
		  status,
		  active,
		  created,
		  updated
		FROM project_revenues
		WHERE project_id = $1
		ORDER BY expected_on ASC NULLS LAST, created ASC, id ASC
		`,
		projectID,
	); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *ProjectRepository) withRevenueReceipts(
	ctx context.Context,
	revenueRecords []projectRevenueRecord,
) ([]usecase.ProjectRevenue, error) {
	revenues := make([]usecase.ProjectRevenue, 0, len(revenueRecords))
	revenueIDs := make([]string, 0, len(revenueRecords))
	revenueIndexByID := make(map[string]int, len(revenueRecords))

	for _, record := range revenueRecords {
		revenueIndexByID[record.ID] = len(revenues)
		revenueIDs = append(revenueIDs, record.ID)
		revenues = append(revenues, usecase.ProjectRevenue{
			ID:          record.ID,
			ProjectID:   record.ProjectID,
			Title:       record.Title,
			Description: record.Description,
			Objective:   record.Objective,
			Amount:      record.Amount,
			ExpectedOn:  record.ExpectedOn,
			ReceivedOn:  record.ReceivedOn,
			Status:      record.Status,
			Active:      record.Active,
			Receipts:    []usecase.ProjectRevenueReceipt{},
			Created:     record.Created,
			Updated:     record.Updated,
		})
	}

	if len(revenueIDs) == 0 {
		return revenues, nil
	}

	var receiptRecords []projectRevenueReceiptRecord
	if err := r.db.SelectContext(
		ctx,
		&receiptRecords,
		`
		SELECT
		  id,
		  project_revenue_id,
		  file_name,
		  file_key,
		  content_type,
		  issued_on,
		  notes,
		  created,
		  updated
		FROM project_revenue_receipts
		WHERE project_revenue_id = ANY($1::uuid[])
		ORDER BY created ASC, id ASC
		`,
		pq.Array(revenueIDs),
	); err != nil {
		return nil, err
	}

	for _, receiptRecord := range receiptRecords {
		index, exists := revenueIndexByID[receiptRecord.ProjectRevenueID]
		if !exists {
			continue
		}
		revenues[index].Receipts = append(revenues[index].Receipts, usecase.ProjectRevenueReceipt{
			ID:               receiptRecord.ID,
			ProjectRevenueID: receiptRecord.ProjectRevenueID,
			FileName:         receiptRecord.FileName,
			FileKey:          receiptRecord.FileKey,
			ContentType:      receiptRecord.ContentType,
			IssuedOn:         receiptRecord.IssuedOn,
			Notes:            receiptRecord.Notes,
			Created:          receiptRecord.Created,
			Updated:          receiptRecord.Updated,
		})
	}

	return revenues, nil
}

func (r *ProjectRepository) listProjectPhaseRecords(
	ctx context.Context,
	projectID string,
) ([]projectPhaseRecord, error) {
	var records []projectPhaseRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  id,
		  project_id,
		  name,
		  description,
		  objective,
		  starts_on,
		  ends_on,
		  position,
		  active,
		  created,
		  updated
			FROM project_phases
			WHERE project_id = $1
			ORDER BY starts_on ASC NULLS LAST, position ASC, created ASC, id ASC
			`,
		projectID,
	); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *ProjectRepository) withPhaseFiles(
	ctx context.Context,
	phaseRecords []projectPhaseRecord,
) ([]usecase.ProjectPhase, error) {
	phases := make([]usecase.ProjectPhase, 0, len(phaseRecords))
	phaseIDs := make([]string, 0, len(phaseRecords))
	phaseIndexByID := make(map[string]int, len(phaseRecords))

	for _, record := range phaseRecords {
		phaseIndexByID[record.ID] = len(phases)
		phaseIDs = append(phaseIDs, record.ID)
		phases = append(phases, usecase.ProjectPhase{
			ID:          record.ID,
			ProjectID:   record.ProjectID,
			Name:        record.Name,
			Description: record.Description,
			Objective:   record.Objective,
			StartsOn:    record.StartsOn,
			EndsOn:      record.EndsOn,
			Position:    record.Position,
			Active:      record.Active,
			Files:       []usecase.ProjectRelatedFile{},
			Created:     record.Created,
			Updated:     record.Updated,
		})
	}

	if len(phaseIDs) == 0 {
		return phases, nil
	}

	var fileRecords []projectRelatedFileRecord
	if err := r.db.SelectContext(
		ctx,
		&fileRecords,
		`
		SELECT
		  id,
		  project_phase_id AS parent_id,
		  file_name,
		  file_key,
		  content_type,
		  notes,
		  created,
		  updated
		FROM project_phase_files
		WHERE project_phase_id = ANY($1::uuid[])
		ORDER BY created ASC, id ASC
		`,
		pq.Array(phaseIDs),
	); err != nil {
		return nil, err
	}

	for _, fileRecord := range fileRecords {
		index, exists := phaseIndexByID[fileRecord.ParentID]
		if !exists {
			continue
		}
		phases[index].Files = append(phases[index].Files, usecase.ProjectRelatedFile{
			ID:          fileRecord.ID,
			FileName:    fileRecord.FileName,
			FileKey:     fileRecord.FileKey,
			ContentType: fileRecord.ContentType,
			Notes:       fileRecord.Notes,
			Created:     fileRecord.Created,
			Updated:     fileRecord.Updated,
		})
	}

	return phases, nil
}

func (r *ProjectRepository) listProjectTaskRecords(
	ctx context.Context,
	projectID string,
) ([]projectTaskRecord, error) {
	var records []projectTaskRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  task.id,
		  task.project_id,
		  COALESCE(task.project_phase_id::text, '') AS project_phase_id,
		  COALESCE(task.responsible_user_id::text, '') AS responsible_user_id,
		  COALESCE(user_record.name, '') AS responsible_user_name,
		  task.name,
		  task.description,
		  task.objective,
		  task.starts_on,
		  task.ends_on,
		  task.position,
		  task.status,
		  task.active,
		  task.created,
		  task.updated
		FROM project_tasks task
		LEFT JOIN users user_record ON user_record.id = task.responsible_user_id
		WHERE task.project_id = $1
		ORDER BY task.starts_on ASC NULLS LAST, task.position ASC, task.created ASC, task.id ASC
		`,
		projectID,
	); err != nil {
		if !isUndefinedRelationOrColumn(err) {
			return nil, err
		}

		// Fallback para bases antigas sem coluna responsible_user_id.
		if fallbackErr := r.db.SelectContext(
			ctx,
			&records,
			`
			SELECT
			  task.id,
			  task.project_id,
			  COALESCE(task.project_phase_id::text, '') AS project_phase_id,
			  '' AS responsible_user_id,
			  '' AS responsible_user_name,
			  task.name,
			  task.description,
			  task.objective,
			  task.starts_on,
			  task.ends_on,
			  task.position,
			  task.status,
			  task.active,
			  task.created,
			  task.updated
			FROM project_tasks task
			WHERE task.project_id = $1
			ORDER BY task.starts_on ASC NULLS LAST, task.position ASC, task.created ASC, task.id ASC
			`,
			projectID,
		); fallbackErr != nil {
			return nil, fallbackErr
		}
	}

	return records, nil
}

func (r *ProjectRepository) withTaskFiles(
	ctx context.Context,
	taskRecords []projectTaskRecord,
) ([]usecase.ProjectTask, error) {
	tasks := make([]usecase.ProjectTask, 0, len(taskRecords))
	taskIDs := make([]string, 0, len(taskRecords))
	taskIndexByID := make(map[string]int, len(taskRecords))

	for _, record := range taskRecords {
		taskIndexByID[record.ID] = len(tasks)
		taskIDs = append(taskIDs, record.ID)
		tasks = append(tasks, usecase.ProjectTask{
			ID:                  record.ID,
			ProjectID:           record.ProjectID,
			ProjectPhaseID:      record.ProjectPhaseID,
			ResponsibleUserID:   record.ResponsibleUserID,
			ResponsibleUserName: record.ResponsibleUserName,
			Name:                record.Name,
			Description:         record.Description,
			Objective:           record.Objective,
			StartsOn:            record.StartsOn,
			EndsOn:              record.EndsOn,
			Position:            record.Position,
			Status:              record.Status,
			Active:              record.Active,
			Files:               []usecase.ProjectRelatedFile{},
			Created:             record.Created,
			Updated:             record.Updated,
		})
	}

	if len(taskIDs) == 0 {
		return tasks, nil
	}

	var fileRecords []projectRelatedFileRecord
	if err := r.db.SelectContext(
		ctx,
		&fileRecords,
		`
		SELECT
		  id,
		  project_task_id AS parent_id,
		  file_name,
		  file_key,
		  content_type,
		  notes,
		  created,
		  updated
		FROM project_task_files
		WHERE project_task_id = ANY($1::uuid[])
		ORDER BY created ASC, id ASC
		`,
		pq.Array(taskIDs),
	); err != nil {
		return nil, err
	}

	for _, fileRecord := range fileRecords {
		index, exists := taskIndexByID[fileRecord.ParentID]
		if !exists {
			continue
		}
		tasks[index].Files = append(tasks[index].Files, usecase.ProjectRelatedFile{
			ID:          fileRecord.ID,
			FileName:    fileRecord.FileName,
			FileKey:     fileRecord.FileKey,
			ContentType: fileRecord.ContentType,
			Notes:       fileRecord.Notes,
			Created:     fileRecord.Created,
			Updated:     fileRecord.Updated,
		})
	}

	return tasks, nil
}

func (r *ProjectRepository) listProjectTaskCommentRecords(
	ctx context.Context,
	taskID string,
) ([]projectTaskCommentRecord, error) {
	var records []projectTaskCommentRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  comment.id,
		  comment.project_task_id,
		  COALESCE(comment.parent_comment_id::text, '') AS parent_comment_id,
		  COALESCE(comment.user_id::text, '') AS user_id,
		  COALESCE(comment.client_id::text, '') AS client_id,
		  COALESCE(user_record.name, client_record.name, '') AS author_name,
		  CASE
		    WHEN comment.client_id IS NOT NULL THEN 'client'
		    ELSE 'user'
		  END AS author_type,
		  EXISTS (
		    SELECT 1
		    FROM project_tasks task_record
		    WHERE task_record.id = comment.project_task_id
		      AND task_record.responsible_user_id = comment.user_id
		  ) AS is_task_responsible,
		  EXISTS (
		    SELECT 1
		    FROM project_tasks task_record
		    INNER JOIN project_managers project_manager
		      ON project_manager.project_id = task_record.project_id
		    WHERE task_record.id = comment.project_task_id
		      AND project_manager.user_id = comment.user_id
		  ) AS is_project_manager,
		  comment.comment,
		  comment.created,
		  comment.updated
		FROM project_task_comments comment
		LEFT JOIN users user_record ON user_record.id = comment.user_id
		LEFT JOIN clients client_record ON client_record.id = comment.client_id
		WHERE comment.project_task_id = $1
		ORDER BY comment.created ASC, comment.id ASC
		`,
		taskID,
	); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *ProjectRepository) withTaskCommentFiles(
	ctx context.Context,
	commentRecords []projectTaskCommentRecord,
) ([]usecase.ProjectTaskComment, error) {
	comments := make([]usecase.ProjectTaskComment, 0, len(commentRecords))
	commentIDs := make([]string, 0, len(commentRecords))
	commentIndexByID := make(map[string]int, len(commentRecords))

	for _, record := range commentRecords {
		commentIndexByID[record.ID] = len(comments)
		commentIDs = append(commentIDs, record.ID)
		comments = append(comments, usecase.ProjectTaskComment{
			ID:                record.ID,
			ProjectTaskID:     record.ProjectTaskID,
			ParentCommentID:   record.ParentCommentID,
			UserID:            record.UserID,
			ClientID:          record.ClientID,
			AuthorName:        record.AuthorName,
			AuthorType:        record.AuthorType,
			IsProjectManager:  record.IsProjectManager,
			IsTaskResponsible: record.IsTaskResponsible,
			Comment:           record.Comment,
			Files:             []usecase.ProjectRelatedFile{},
			Created:           record.Created,
			Updated:           record.Updated,
		})
	}

	if len(commentIDs) == 0 {
		return comments, nil
	}

	var fileRecords []projectRelatedFileRecord
	if err := r.db.SelectContext(
		ctx,
		&fileRecords,
		`
		SELECT
		  id,
		  project_task_comment_id AS parent_id,
		  file_name,
		  file_key,
		  content_type,
		  notes,
		  created,
		  updated
		FROM project_task_comment_files
		WHERE project_task_comment_id = ANY($1::uuid[])
		ORDER BY created ASC, id ASC
		`,
		pq.Array(commentIDs),
	); err != nil {
		return nil, err
	}

	for _, fileRecord := range fileRecords {
		index, exists := commentIndexByID[fileRecord.ParentID]
		if !exists {
			continue
		}
		comments[index].Files = append(comments[index].Files, usecase.ProjectRelatedFile{
			ID:          fileRecord.ID,
			FileName:    fileRecord.FileName,
			FileKey:     fileRecord.FileKey,
			ContentType: fileRecord.ContentType,
			Notes:       fileRecord.Notes,
			Created:     fileRecord.Created,
			Updated:     fileRecord.Updated,
		})
	}

	return comments, nil
}

func (r *ProjectRepository) replaceProjectClients(
	ctx context.Context,
	tx *sqlx.Tx,
	projectID string,
	clientIDs []string,
) error {
	if _, err := tx.ExecContext(
		ctx,
		"DELETE FROM project_clients WHERE project_id = $1",
		projectID,
	); err != nil {
		return err
	}

	for _, clientID := range clientIDs {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO project_clients (
			  project_id,
			  client_id,
			  role,
			  created,
			  updated
			)
			VALUES ($1, $2, '', NOW(), NOW())
			`,
			projectID,
			clientID,
		); err != nil {
			return mapProjectPersistenceError(err)
		}
	}

	return nil
}

func (r *ProjectRepository) replaceProjectManagers(
	ctx context.Context,
	tx *sqlx.Tx,
	projectID string,
	managerUserIDs []string,
) error {
	if _, err := tx.ExecContext(
		ctx,
		"DELETE FROM project_managers WHERE project_id = $1",
		projectID,
	); err != nil {
		return err
	}

	for _, userID := range managerUserIDs {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO project_managers (
			  project_id,
			  user_id,
			  created,
			  updated
			)
			VALUES ($1, $2, NOW(), NOW())
			`,
			projectID,
			userID,
		); err != nil {
			return mapProjectPersistenceError(err)
		}
	}

	return nil
}

func (r *ProjectRepository) projectExists(ctx context.Context, projectID string) (bool, error) {
	var exists bool
	if err := r.db.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM projects WHERE id = $1)",
		projectID,
	); err != nil {
		return false, err
	}

	return exists, nil
}

func (r *ProjectRepository) RecalculateProjectTimeline(
	ctx context.Context,
	projectID string,
) (usecase.ProjectDetail, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ProjectDetail{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var exists bool
	if err := tx.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM projects WHERE id = $1)",
		projectID,
	); err != nil {
		return usecase.ProjectDetail{}, err
	}
	if !exists {
		return usecase.ProjectDetail{}, usecase.ErrNotFound
	}

	if err := r.recalculateProjectTimeline(ctx, tx, projectID); err != nil {
		return usecase.ProjectDetail{}, mapProjectPersistenceError(err)
	}

	if err := tx.Commit(); err != nil {
		return usecase.ProjectDetail{}, err
	}

	return r.GetProjectDetail(ctx, projectID)
}

func (r *ProjectRepository) recalculateProjectTimeline(
	ctx context.Context,
	tx *sqlx.Tx,
	projectID string,
) error {
	phases, err := r.listProjectPhaseTimelineRecords(ctx, tx, projectID)
	if err != nil {
		return err
	}

	tasks, err := r.listProjectTaskTimelineRecords(ctx, tx, projectID)
	if err != nil {
		return err
	}

	type dateRange struct {
		startsOn *time.Time
		endsOn   *time.Time
	}

	taskRanges := make(map[string]dateRange, len(tasks))
	taskMetaByID := make(map[string]plannerTaskMeta, len(tasks))
	tasksByPhaseID := make(map[string][]projectTaskTimelineRecord)
	for _, task := range tasks {
		taskRanges[task.ID] = dateRange{startsOn: task.StartsOn, endsOn: task.EndsOn}
		if meta, ok := parsePlannerTaskMeta(task.Objective); ok {
			taskMetaByID[task.ID] = meta
		}

		if task.ProjectPhaseID == "" || isProjectTimelineTaskCancelled(task.Status) {
			continue
		}

		meta, hasMeta := taskMetaByID[task.ID]
		if hasMeta && meta.Kind == "subphase" {
			continue
		}

		if task.ProjectPhaseID != "" {
			tasksByPhaseID[task.ProjectPhaseID] = append(tasksByPhaseID[task.ProjectPhaseID], task)
		}
	}

	for _, task := range tasks {
		if isProjectTimelineTaskCancelled(task.Status) {
			continue
		}

		meta, isMetaTask := taskMetaByID[task.ID]
		if !isMetaTask || meta.Kind != "subphase" {
			continue
		}

		var (
			subPhaseStart *time.Time
			subPhaseEnd   *time.Time
		)
		for _, candidateTask := range tasks {
			if isProjectTimelineTaskCancelled(candidateTask.Status) {
				continue
			}

			candidateMeta, candidateHasMeta := taskMetaByID[candidateTask.ID]
			if !candidateHasMeta || candidateMeta.Kind != "task" {
				continue
			}
			if candidateMeta.ParentType != "subphase" || candidateMeta.ParentID != task.ID {
				continue
			}

			candidateRange := taskRanges[candidateTask.ID]
			mergeProjectDateRange(
				&subPhaseStart,
				&subPhaseEnd,
				candidateRange.startsOn,
				candidateRange.endsOn,
			)
		}

		currentRange := taskRanges[task.ID]
		if sameDatePointer(currentRange.startsOn, subPhaseStart) &&
			sameDatePointer(currentRange.endsOn, subPhaseEnd) {
			taskRanges[task.ID] = dateRange{startsOn: subPhaseStart, endsOn: subPhaseEnd}
			continue
		}

		if _, err := tx.ExecContext(
			ctx,
			`
			UPDATE project_tasks
			SET starts_on = $1,
			    ends_on = $2,
			    updated = NOW()
			WHERE id = $3
			`,
			subPhaseStart,
			subPhaseEnd,
			task.ID,
		); err != nil {
			return err
		}

		taskRanges[task.ID] = dateRange{startsOn: subPhaseStart, endsOn: subPhaseEnd}
	}

	phaseRanges := make(map[string]dateRange, len(phases))
	for _, phase := range phases {
		currentRange := dateRange{startsOn: phase.StartsOn, endsOn: phase.EndsOn}
		phaseTasks := tasksByPhaseID[phase.ID]

		var (
			phaseStart *time.Time
			phaseEnd   *time.Time
		)
		for _, phaseTask := range phaseTasks {
			taskRange := taskRanges[phaseTask.ID]
			mergeProjectDateRange(
				&phaseStart,
				&phaseEnd,
				taskRange.startsOn,
				taskRange.endsOn,
			)
		}

		if !sameDatePointer(currentRange.startsOn, phaseStart) ||
			!sameDatePointer(currentRange.endsOn, phaseEnd) {
			if _, err := tx.ExecContext(
				ctx,
				`
				UPDATE project_phases
				SET starts_on = $1,
				    ends_on = $2,
				    updated = NOW()
				WHERE id = $3
				`,
				phaseStart,
				phaseEnd,
				phase.ID,
			); err != nil {
				return err
			}
		}

		phaseRanges[phase.ID] = dateRange{startsOn: phaseStart, endsOn: phaseEnd}
	}

	var (
		projectStart *time.Time
		projectEnd   *time.Time
	)
	for _, phase := range phases {
		phaseRange, hasPhaseRange := phaseRanges[phase.ID]
		if !hasPhaseRange {
			phaseRange = dateRange{startsOn: phase.StartsOn, endsOn: phase.EndsOn}
		}
		mergeProjectDateRange(
			&projectStart,
			&projectEnd,
			phaseRange.startsOn,
			phaseRange.endsOn,
		)
	}

	for _, task := range tasks {
		if task.ProjectPhaseID != "" || isProjectTimelineTaskCancelled(task.Status) {
			continue
		}

		taskRange := taskRanges[task.ID]
		mergeProjectDateRange(
			&projectStart,
			&projectEnd,
			taskRange.startsOn,
			taskRange.endsOn,
		)
	}

	var currentProjectDates struct {
		StartDate *time.Time `db:"start_date"`
		EndDate   *time.Time `db:"end_date"`
	}
	if err := tx.GetContext(
		ctx,
		&currentProjectDates,
		"SELECT start_date, end_date FROM projects WHERE id = $1",
		projectID,
	); err != nil {
		return err
	}

	if sameDatePointer(currentProjectDates.StartDate, projectStart) &&
		sameDatePointer(currentProjectDates.EndDate, projectEnd) {
		return nil
	}

	if _, err := tx.ExecContext(
		ctx,
		`
		UPDATE projects
		SET start_date = $1,
		    end_date = $2,
		    updated = NOW()
		WHERE id = $3
		`,
		projectStart,
		projectEnd,
		projectID,
	); err != nil {
		return err
	}

	return nil
}

func (r *ProjectRepository) listProjectTaskTimelineRecords(
	ctx context.Context,
	tx *sqlx.Tx,
	projectID string,
) ([]projectTaskTimelineRecord, error) {
	var records []projectTaskTimelineRecord
	if err := tx.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  id,
		  COALESCE(project_phase_id::text, '') AS project_phase_id,
		  status,
		  objective,
		  starts_on,
		  ends_on
		FROM project_tasks
		WHERE project_id = $1
		  AND active = TRUE
		ORDER BY position ASC, created ASC, id ASC
		`,
		projectID,
	); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *ProjectRepository) listProjectPhaseTimelineRecords(
	ctx context.Context,
	tx *sqlx.Tx,
	projectID string,
) ([]projectPhaseTimelineRecord, error) {
	var records []projectPhaseTimelineRecord
	if err := tx.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  id,
		  starts_on,
		  ends_on
		FROM project_phases
		WHERE project_id = $1
		  AND active = TRUE
		ORDER BY position ASC, created ASC, id ASC
		`,
		projectID,
	); err != nil {
		return nil, err
	}

	return records, nil
}

func parsePlannerTaskMeta(objective string) (plannerTaskMeta, bool) {
	trimmedObjective := strings.TrimSpace(objective)
	if !strings.HasPrefix(trimmedObjective, plannerTaskMetaPrefix) {
		return plannerTaskMeta{}, false
	}

	rawMeta := strings.TrimSpace(strings.TrimPrefix(trimmedObjective, plannerTaskMetaPrefix))
	if rawMeta == "" {
		return plannerTaskMeta{}, false
	}

	var meta plannerTaskMeta
	if err := json.Unmarshal([]byte(rawMeta), &meta); err != nil {
		return plannerTaskMeta{}, false
	}

	if meta.Kind == "subphase" {
		return meta, true
	}
	if meta.Kind == "task" && (meta.ParentType == "phase" || meta.ParentType == "subphase") {
		return meta, true
	}

	return plannerTaskMeta{}, false
}

func mergeProjectDateRange(
	currentStart **time.Time,
	currentEnd **time.Time,
	candidateStart *time.Time,
	candidateEnd *time.Time,
) {
	if candidateStart != nil && (*currentStart == nil || candidateStart.Before(**currentStart)) {
		start := *candidateStart
		*currentStart = &start
	}

	if candidateEnd != nil && (*currentEnd == nil || candidateEnd.After(**currentEnd)) {
		end := *candidateEnd
		*currentEnd = &end
	}
}

func sameDatePointer(a, b *time.Time) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}

	return a.Format("2006-01-02") == b.Format("2006-01-02")
}

func isProjectTimelineTaskCancelled(status string) bool {
	return strings.ToLower(strings.TrimSpace(status)) == "cancelada"
}

func isUndefinedRelationOrColumn(err error) bool {
	var pgErr *pq.Error
	if !errors.As(err, &pgErr) {
		return false
	}

	return pgErr.Code == "42P01" || pgErr.Code == "42703"
}

func mapProjectPersistenceError(err error) error {
	var pgErr *pq.Error
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			switch pgErr.Constraint {
			case "projects_name_lower_key":
				return usecase.ErrProjectNameInUse
			case "project_types_code_lower_key":
				return usecase.ErrProjectTypeCodeInUse
			case "project_types_category_name_lower_key":
				return usecase.ErrProjectTypeNameInUse
			}
		case "23503":
			switch pgErr.Constraint {
			case "projects_project_type_id_fkey":
				return usecase.ErrProjectTypeNotFound
			case "project_types_category_id_fkey":
				return usecase.ErrProjectCategoryNotFound
			case "project_clients_client_id_fkey":
				return usecase.ErrProjectClientsNotFound
			case "project_managers_user_id_fkey":
				return usecase.ErrProjectManagersNotFound
			case "project_tasks_responsible_user_id_fkey":
				return usecase.ErrInvalidInput
			case "project_task_comments_user_id_fkey", "project_task_comments_client_id_fkey":
				return usecase.ErrInvalidInput
			default:
				return usecase.ErrNotFound
			}
		case "23514":
			return usecase.ErrInvalidInput
		}
	}

	return err
}
