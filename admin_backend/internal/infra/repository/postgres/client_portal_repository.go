package postgres

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type ClientPortalRepository struct {
	db *sqlx.DB
}

func NewClientPortalRepository(db *sqlx.DB) *ClientPortalRepository {
	return &ClientPortalRepository{db: db}
}

type clientPortalAuthRecord struct {
	ID       string `db:"id"`
	Name     string `db:"name"`
	Email    string `db:"email"`
	Login    string `db:"login"`
	Password string `db:"password"`
	Avatar   string `db:"avatar"`
	Active   bool   `db:"active"`
}

type clientPortalAccountRecord struct {
	ID      string    `db:"id"`
	Name    string    `db:"name"`
	Email   string    `db:"email"`
	Login   string    `db:"login"`
	Avatar  string    `db:"avatar"`
	Active  bool      `db:"active"`
	Created time.Time `db:"created"`
	Updated time.Time `db:"updated"`
}

type clientPortalProjectRecord struct {
	ID        string     `db:"id"`
	Name      string     `db:"name"`
	Objective string     `db:"objective"`
	Status    string     `db:"status"`
	Active    bool       `db:"active"`
	StartDate *time.Time `db:"start_date"`
	EndDate   *time.Time `db:"end_date"`
	Created   time.Time  `db:"created"`
	Updated   time.Time  `db:"updated"`
}

type clientServiceRequestRecord struct {
	ID          string    `db:"id"`
	ClientID    string    `db:"client_id"`
	ProjectID   string    `db:"project_id"`
	ProjectName string    `db:"project_name"`
	Title       string    `db:"title"`
	Description string    `db:"description"`
	Status      string    `db:"status"`
	Created     time.Time `db:"created"`
	Updated     time.Time `db:"updated"`
}

type clientServiceRequestFileRecord struct {
	ID          string    `db:"id"`
	RequestID   string    `db:"request_id"`
	FileName    string    `db:"file_name"`
	FileKey     string    `db:"file_key"`
	ContentType string    `db:"content_type"`
	Notes       string    `db:"notes"`
	Created     time.Time `db:"created"`
	Updated     time.Time `db:"updated"`
}

type adminServiceRequestRecord struct {
	ID           string    `db:"id"`
	ClientID     string    `db:"client_id"`
	ClientName   string    `db:"client_name"`
	ClientEmail  string    `db:"client_email"`
	ClientLogin  string    `db:"client_login"`
	ProjectID    string    `db:"project_id"`
	ProjectName  string    `db:"project_name"`
	Title        string    `db:"title"`
	Description  string    `db:"description"`
	Status       string    `db:"status"`
	Comments     int       `db:"comments"`
	OpenComments int       `db:"open_comments"`
	Created      time.Time `db:"created"`
	Updated      time.Time `db:"updated"`
}

type serviceRequestCommentRecord struct {
	ID               string    `db:"id"`
	ServiceRequestID string    `db:"service_request_id"`
	ParentCommentID  string    `db:"parent_comment_id"`
	UserID           string    `db:"user_id"`
	ClientID         string    `db:"client_id"`
	AuthorName       string    `db:"author_name"`
	AuthorAvatar     string    `db:"author_avatar"`
	AuthorType       string    `db:"author_type"`
	Comment          string    `db:"comment"`
	Created          time.Time `db:"created"`
	Updated          time.Time `db:"updated"`
}

type serviceRequestCommentFileRecord struct {
	ID          string    `db:"id"`
	CommentID   string    `db:"comment_id"`
	FileName    string    `db:"file_name"`
	FileKey     string    `db:"file_key"`
	ContentType string    `db:"content_type"`
	Notes       string    `db:"notes"`
	Created     time.Time `db:"created"`
	Updated     time.Time `db:"updated"`
}

func (r *ClientPortalRepository) FindClientByLoginOrEmail(
	ctx context.Context,
	login string,
) (usecase.ClientPortalAuthUser, error) {
	var record clientPortalAuthRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`
		SELECT
		  id,
		  name,
		  email,
		  login,
		  password,
		  COALESCE(avatar, '') AS avatar,
		  active
		FROM clients
		WHERE LOWER(login) = LOWER($1)
		   OR LOWER(email) = LOWER($1)
		LIMIT 1
		`,
		login,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ClientPortalAuthUser{}, usecase.ErrNotFound
		}
		return usecase.ClientPortalAuthUser{}, err
	}

	return mapClientPortalAuthRecord(record), nil
}

func (r *ClientPortalRepository) GetClientAuthByID(
	ctx context.Context,
	clientID string,
) (usecase.ClientPortalAuthUser, error) {
	var record clientPortalAuthRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`
		SELECT
		  id,
		  name,
		  email,
		  login,
		  password,
		  COALESCE(avatar, '') AS avatar,
		  active
		FROM clients
		WHERE id = $1
		LIMIT 1
		`,
		clientID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ClientPortalAuthUser{}, usecase.ErrNotFound
		}
		return usecase.ClientPortalAuthUser{}, err
	}

	return mapClientPortalAuthRecord(record), nil
}

func (r *ClientPortalRepository) CreateBasicClient(
	ctx context.Context,
	input usecase.CreateClientPortalAccountInput,
) (usecase.ClientPortalAccount, error) {
	var account clientPortalAccountRecord
	if err := r.db.GetContext(
		ctx,
		&account,
		`
		INSERT INTO clients (
		  name,
		  email,
		  login,
		  password,
		  avatar,
		  active,
		  created,
		  updated
		)
		VALUES (
		  $1,
		  $2,
		  $3,
		  $4,
		  NULLIF($5, ''),
		  TRUE,
		  NOW(),
		  NOW()
		)
		RETURNING
		  id,
		  name,
		  email,
		  login,
		  COALESCE(avatar, '') AS avatar,
		  active,
		  created,
		  updated
		`,
		input.Name,
		input.Email,
		input.Login,
		input.Password,
		input.Avatar,
	); err != nil {
		return usecase.ClientPortalAccount{}, mapClientPortalPersistenceError(err)
	}

	return mapClientPortalAccountRecord(account), nil
}

func (r *ClientPortalRepository) GetClientAccount(
	ctx context.Context,
	clientID string,
) (usecase.ClientPortalAccount, error) {
	var account clientPortalAccountRecord
	if err := r.db.GetContext(
		ctx,
		&account,
		`
		SELECT
		  id,
		  name,
		  email,
		  login,
		  COALESCE(avatar, '') AS avatar,
		  active,
		  created,
		  updated
		FROM clients
		WHERE id = $1
		LIMIT 1
		`,
		clientID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ClientPortalAccount{}, usecase.ErrNotFound
		}
		return usecase.ClientPortalAccount{}, err
	}

	return mapClientPortalAccountRecord(account), nil
}

func (r *ClientPortalRepository) UpdateClientAccount(
	ctx context.Context,
	input usecase.UpdateClientPortalAccountInput,
) (usecase.ClientPortalAccount, error) {
	var account clientPortalAccountRecord
	if err := r.db.GetContext(
		ctx,
		&account,
		`
		UPDATE clients
		SET name = $1,
		    email = $2,
		    login = $3,
		    password = COALESCE(NULLIF($4, ''), password),
		    avatar = NULLIF($5, ''),
		    updated = NOW()
		WHERE id = $6
		RETURNING
		  id,
		  name,
		  email,
		  login,
		  COALESCE(avatar, '') AS avatar,
		  active,
		  created,
		  updated
		`,
		input.Name,
		input.Email,
		input.Login,
		input.Password,
		input.Avatar,
		input.ClientID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ClientPortalAccount{}, usecase.ErrNotFound
		}
		return usecase.ClientPortalAccount{}, mapClientPortalPersistenceError(err)
	}

	return mapClientPortalAccountRecord(account), nil
}

func (r *ClientPortalRepository) ListClientProjects(
	ctx context.Context,
	clientID string,
) ([]usecase.ClientPortalProject, error) {
	var records []clientPortalProjectRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  project.id,
		  project.name,
		  project.objective,
		  COALESCE(NULLIF(project.status, ''), 'planejamento') AS status,
		  project.active,
		  project.start_date,
		  project.end_date,
		  project.created,
		  project.updated
		FROM project_clients project_client
		INNER JOIN projects project ON project.id = project_client.project_id
		WHERE project_client.client_id = $1
		ORDER BY project.created DESC, project.id DESC
		`,
		clientID,
	); err != nil {
		return nil, err
	}

	projects := make([]usecase.ClientPortalProject, 0, len(records))
	for _, record := range records {
		projects = append(projects, usecase.ClientPortalProject{
			ID:        record.ID,
			Name:      record.Name,
			Objective: record.Objective,
			Status:    normalizeProjectStatus(record.Status),
			Active:    record.Active,
			StartDate: record.StartDate,
			EndDate:   record.EndDate,
			Created:   record.Created,
			Updated:   record.Updated,
		})
	}

	return projects, nil
}

func (r *ClientPortalRepository) ClientHasProjectAccess(
	ctx context.Context,
	clientID, projectID string,
) (bool, error) {
	var hasAccess bool
	if err := r.db.GetContext(
		ctx,
		&hasAccess,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM project_clients project_client
		  WHERE project_client.client_id = $1
		    AND project_client.project_id = $2
		)
		`,
		clientID,
		projectID,
	); err != nil {
		return false, err
	}

	return hasAccess, nil
}

func (r *ClientPortalRepository) CountOpenServiceRequests(
	ctx context.Context,
	clientID string,
) (int, error) {
	var total int
	if err := r.db.GetContext(
		ctx,
		&total,
		`
		SELECT COUNT(*)::int
		FROM client_service_requests
		WHERE client_id = $1
		  AND status IN ('aberta', 'em_andamento')
		`,
		clientID,
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return 0, nil
		}
		return 0, err
	}

	return total, nil
}

func (r *ClientPortalRepository) ListClientServiceRequests(
	ctx context.Context,
	clientID string,
) ([]usecase.ClientServiceRequest, error) {
	var requestRecords []clientServiceRequestRecord
	if err := r.db.SelectContext(
		ctx,
		&requestRecords,
		`
		SELECT
		  request.id,
		  request.client_id,
		  COALESCE(request.project_id::text, '') AS project_id,
		  COALESCE(project.name, '') AS project_name,
		  request.title,
		  request.description,
		  request.status,
		  request.created,
		  request.updated
		FROM client_service_requests request
		LEFT JOIN projects project ON project.id = request.project_id
		WHERE request.client_id = $1
		ORDER BY request.created DESC, request.id DESC
		`,
		clientID,
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return []usecase.ClientServiceRequest{}, nil
		}
		return nil, err
	}

	requests := make([]usecase.ClientServiceRequest, 0, len(requestRecords))
	requestIDs := make([]string, 0, len(requestRecords))
	requestIndexByID := make(map[string]int, len(requestRecords))

	for _, record := range requestRecords {
		requestIndexByID[record.ID] = len(requests)
		requestIDs = append(requestIDs, record.ID)
		requests = append(requests, usecase.ClientServiceRequest{
			ID:          record.ID,
			ClientID:    record.ClientID,
			ProjectID:   strings.TrimSpace(record.ProjectID),
			ProjectName: record.ProjectName,
			Title:       record.Title,
			Description: record.Description,
			Status:      normalizeServiceRequestStatus(record.Status),
			Files:       []usecase.ClientServiceRequestFile{},
			Created:     record.Created,
			Updated:     record.Updated,
		})
	}

	if len(requestIDs) == 0 {
		return requests, nil
	}

	var fileRecords []clientServiceRequestFileRecord
	if err := r.db.SelectContext(
		ctx,
		&fileRecords,
		`
		SELECT
		  file.id,
		  file.service_request_id AS request_id,
		  file.file_name,
		  file.file_key,
		  file.content_type,
		  file.notes,
		  file.created,
		  file.updated
		FROM client_service_request_files file
		WHERE file.service_request_id = ANY($1::uuid[])
		ORDER BY file.created ASC, file.id ASC
		`,
		pq.Array(requestIDs),
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return requests, nil
		}
		return nil, err
	}

	for _, fileRecord := range fileRecords {
		index, exists := requestIndexByID[fileRecord.RequestID]
		if !exists {
			continue
		}
		requests[index].Files = append(requests[index].Files, usecase.ClientServiceRequestFile{
			ID:          fileRecord.ID,
			FileName:    fileRecord.FileName,
			FileKey:     fileRecord.FileKey,
			ContentType: fileRecord.ContentType,
			Notes:       fileRecord.Notes,
			Created:     fileRecord.Created,
			Updated:     fileRecord.Updated,
		})
	}

	return requests, nil
}

func (r *ClientPortalRepository) CreateClientServiceRequest(
	ctx context.Context,
	input usecase.CreateClientServiceRequestInput,
) (usecase.ClientServiceRequest, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ClientServiceRequest{}, err
	}
	defer tx.Rollback()

	var requestID string
	if err := tx.GetContext(
		ctx,
		&requestID,
		`
		INSERT INTO client_service_requests (
		  client_id,
		  project_id,
		  title,
		  description,
		  status,
		  created,
		  updated
		)
		VALUES (
		  $1,
		  NULLIF($2, '')::uuid,
		  $3,
		  $4,
		  'aberta',
		  NOW(),
		  NOW()
		)
		RETURNING id
		`,
		input.ClientID,
		input.ProjectID,
		input.Title,
		input.Description,
	); err != nil {
		return usecase.ClientServiceRequest{}, mapClientPortalPersistenceError(err)
	}

	for _, file := range input.Files {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO client_service_request_files (
			  service_request_id,
			  file_name,
			  file_key,
			  content_type,
			  notes,
			  created,
			  updated
			)
			VALUES (
			  $1,
			  $2,
			  $3,
			  $4,
			  $5,
			  NOW(),
			  NOW()
			)
			`,
			requestID,
			file.FileName,
			file.FileKey,
			file.ContentType,
			file.Notes,
		); err != nil {
			return usecase.ClientServiceRequest{}, mapClientPortalPersistenceError(err)
		}
	}

	if strings.TrimSpace(input.Description) != "" {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO client_service_request_comments (
			  service_request_id,
			  parent_comment_id,
			  user_id,
			  client_id,
			  comment,
			  created,
			  updated
			)
			VALUES (
			  $1,
			  NULL,
			  NULL,
			  $2,
			  $3,
			  NOW(),
			  NOW()
			)
			`,
			requestID,
			input.ClientID,
			input.Description,
		); err != nil {
			return usecase.ClientServiceRequest{}, mapClientPortalPersistenceError(err)
		}
	}

	if err := tx.Commit(); err != nil {
		return usecase.ClientServiceRequest{}, err
	}

	requests, err := r.ListClientServiceRequests(ctx, input.ClientID)
	if err != nil {
		return usecase.ClientServiceRequest{}, err
	}
	for _, request := range requests {
		if request.ID == requestID {
			return request, nil
		}
	}

	return usecase.ClientServiceRequest{}, usecase.ErrNotFound
}

func (r *ClientPortalRepository) CancelClientServiceRequest(
	ctx context.Context,
	clientID string,
	requestID string,
) (usecase.ClientServiceRequest, error) {
	result, err := r.db.ExecContext(
		ctx,
		`
		UPDATE client_service_requests
		SET status = 'cancelada',
		    updated = NOW()
		WHERE id = $1
		  AND client_id = $2
		  AND status IN ('aberta', 'em_andamento')
		`,
		requestID,
		clientID,
	)
	if err != nil {
		return usecase.ClientServiceRequest{}, mapClientPortalPersistenceError(err)
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return usecase.ClientServiceRequest{}, err
	}

	if affectedRows == 0 {
		var currentStatus string
		statusErr := r.db.GetContext(
			ctx,
			&currentStatus,
			`
			SELECT status
			FROM client_service_requests
			WHERE id = $1
			  AND client_id = $2
			LIMIT 1
			`,
			requestID,
			clientID,
		)
		if statusErr != nil {
			if errors.Is(statusErr, sql.ErrNoRows) {
				return usecase.ClientServiceRequest{}, usecase.ErrNotFound
			}
			return usecase.ClientServiceRequest{}, statusErr
		}

		normalizedStatus := normalizeServiceRequestStatus(currentStatus)
		if normalizedStatus == "cancelada" || normalizedStatus == "concluida" {
			return usecase.ClientServiceRequest{}, usecase.ErrConflict
		}

		return usecase.ClientServiceRequest{}, usecase.ErrConflict
	}

	requests, err := r.ListClientServiceRequests(ctx, clientID)
	if err != nil {
		return usecase.ClientServiceRequest{}, err
	}

	for _, request := range requests {
		if request.ID == requestID {
			return request, nil
		}
	}

	return usecase.ClientServiceRequest{}, usecase.ErrNotFound
}

func (r *ClientPortalRepository) ListAdminServiceRequests(
	ctx context.Context,
) ([]usecase.AdminServiceRequest, error) {
	var records []adminServiceRequestRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  request.id,
		  request.client_id,
		  COALESCE(client_record.name, '') AS client_name,
		  COALESCE(client_record.email, '') AS client_email,
		  COALESCE(client_record.login, '') AS client_login,
		  COALESCE(request.project_id::text, '') AS project_id,
		  COALESCE(project.name, '') AS project_name,
		  request.title,
		  request.description,
		  request.status,
		  COALESCE(comment_totals.total_comments, 0)::int AS comments,
		  COALESCE(comment_totals.client_comments, 0)::int AS open_comments,
		  request.created,
		  request.updated
		FROM client_service_requests request
		INNER JOIN clients client_record ON client_record.id = request.client_id
		LEFT JOIN projects project ON project.id = request.project_id
		LEFT JOIN (
		  SELECT
		    comment.service_request_id,
		    COUNT(*)::int AS total_comments,
		    COUNT(*) FILTER (WHERE comment.client_id IS NOT NULL)::int AS client_comments
		  FROM client_service_request_comments comment
		  GROUP BY comment.service_request_id
		) comment_totals ON comment_totals.service_request_id = request.id
		ORDER BY
		  CASE WHEN request.status IN ('aberta', 'em_andamento') THEN 0 ELSE 1 END ASC,
		  request.created DESC,
		  request.id DESC
		`,
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return []usecase.AdminServiceRequest{}, nil
		}
		return nil, err
	}

	requests := make([]usecase.AdminServiceRequest, 0, len(records))
	for _, record := range records {
		requests = append(requests, mapAdminServiceRequestRecord(record))
	}

	return requests, nil
}

func (r *ClientPortalRepository) GetAdminServiceRequest(
	ctx context.Context,
	requestID string,
) (usecase.AdminServiceRequest, error) {
	var record adminServiceRequestRecord
	if err := r.db.GetContext(
		ctx,
		&record,
		`
		SELECT
		  request.id,
		  request.client_id,
		  COALESCE(client_record.name, '') AS client_name,
		  COALESCE(client_record.email, '') AS client_email,
		  COALESCE(client_record.login, '') AS client_login,
		  COALESCE(request.project_id::text, '') AS project_id,
		  COALESCE(project.name, '') AS project_name,
		  request.title,
		  request.description,
		  request.status,
		  COALESCE(comment_totals.total_comments, 0)::int AS comments,
		  COALESCE(comment_totals.client_comments, 0)::int AS open_comments,
		  request.created,
		  request.updated
		FROM client_service_requests request
		INNER JOIN clients client_record ON client_record.id = request.client_id
		LEFT JOIN projects project ON project.id = request.project_id
		LEFT JOIN (
		  SELECT
		    comment.service_request_id,
		    COUNT(*)::int AS total_comments,
		    COUNT(*) FILTER (WHERE comment.client_id IS NOT NULL)::int AS client_comments
		  FROM client_service_request_comments comment
		  GROUP BY comment.service_request_id
		) comment_totals ON comment_totals.service_request_id = request.id
		WHERE request.id = $1
		LIMIT 1
		`,
		requestID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.AdminServiceRequest{}, usecase.ErrNotFound
		}
		return usecase.AdminServiceRequest{}, err
	}

	request := mapAdminServiceRequestRecord(record)
	files, err := r.listServiceRequestFiles(ctx, requestID)
	if err != nil {
		return usecase.AdminServiceRequest{}, err
	}
	request.Files = files

	return request, nil
}

func (r *ClientPortalRepository) UpdateAdminServiceRequestStatus(
	ctx context.Context,
	input usecase.UpdateAdminServiceRequestStatusInput,
) (usecase.AdminServiceRequest, error) {
	var requestID string
	if err := r.db.GetContext(
		ctx,
		&requestID,
		`
		UPDATE client_service_requests
		SET status = $1,
		    updated = NOW()
		WHERE id = $2
		RETURNING id
		`,
		input.Status,
		input.RequestID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.AdminServiceRequest{}, usecase.ErrNotFound
		}
		return usecase.AdminServiceRequest{}, mapClientPortalPersistenceError(err)
	}

	return r.GetAdminServiceRequest(ctx, requestID)
}

func (r *ClientPortalRepository) ListServiceRequestComments(
	ctx context.Context,
	requestID string,
) ([]usecase.ServiceRequestComment, error) {
	exists, err := r.serviceRequestExists(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, usecase.ErrNotFound
	}

	var records []serviceRequestCommentRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  comment.id,
		  comment.service_request_id,
		  COALESCE(comment.parent_comment_id::text, '') AS parent_comment_id,
		  COALESCE(comment.user_id::text, '') AS user_id,
		  COALESCE(comment.client_id::text, '') AS client_id,
		  COALESCE(user_record.name, client_record.name, '') AS author_name,
		  COALESCE(user_record.avatar, client_record.avatar, '') AS author_avatar,
		  CASE
		    WHEN comment.client_id IS NOT NULL THEN 'client'
		    ELSE 'user'
		  END AS author_type,
		  comment.comment,
		  comment.created,
		  comment.updated
		FROM client_service_request_comments comment
		LEFT JOIN users user_record ON user_record.id = comment.user_id
		LEFT JOIN clients client_record ON client_record.id = comment.client_id
		WHERE comment.service_request_id = $1
		ORDER BY comment.created ASC, comment.id ASC
		`,
		requestID,
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return []usecase.ServiceRequestComment{}, nil
		}
		return nil, err
	}

	comments := make([]usecase.ServiceRequestComment, 0, len(records))
	commentIDs := make([]string, 0, len(records))
	commentIndexByID := make(map[string]int, len(records))
	for _, record := range records {
		commentIndexByID[record.ID] = len(comments)
		commentIDs = append(commentIDs, record.ID)
		comments = append(comments, usecase.ServiceRequestComment{
			ID:               record.ID,
			ServiceRequestID: record.ServiceRequestID,
			ParentCommentID:  strings.TrimSpace(record.ParentCommentID),
			UserID:           strings.TrimSpace(record.UserID),
			ClientID:         strings.TrimSpace(record.ClientID),
			AuthorName:       strings.TrimSpace(record.AuthorName),
			AuthorAvatar:     strings.TrimSpace(record.AuthorAvatar),
			AuthorType:       strings.TrimSpace(record.AuthorType),
			Comment:          record.Comment,
			Files:            []usecase.ServiceRequestCommentFile{},
			Created:          record.Created,
			Updated:          record.Updated,
		})
	}

	if len(commentIDs) == 0 {
		return comments, nil
	}

	var fileRecords []serviceRequestCommentFileRecord
	if err := r.db.SelectContext(
		ctx,
		&fileRecords,
		`
		SELECT
		  file.id,
		  file.service_request_comment_id AS comment_id,
		  file.file_name,
		  file.file_key,
		  file.content_type,
		  file.notes,
		  file.created,
		  file.updated
		FROM client_service_request_comment_files file
		WHERE file.service_request_comment_id = ANY($1::uuid[])
		ORDER BY file.created ASC, file.id ASC
		`,
		pq.Array(commentIDs),
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return comments, nil
		}
		return nil, err
	}

	for _, fileRecord := range fileRecords {
		index, exists := commentIndexByID[fileRecord.CommentID]
		if !exists {
			continue
		}

		comments[index].Files = append(comments[index].Files, usecase.ServiceRequestCommentFile{
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

func (r *ClientPortalRepository) DeleteServiceRequestCommentFile(
	ctx context.Context,
	input usecase.DeleteServiceRequestCommentFileInput,
) error {
	var owner struct {
		UserID   string `db:"user_id"`
		ClientID string `db:"client_id"`
	}
	if err := r.db.GetContext(
		ctx,
		&owner,
		`
		SELECT
		  COALESCE(comment.user_id::text, '') AS user_id,
		  COALESCE(comment.client_id::text, '') AS client_id
		FROM client_service_request_comment_files file
		INNER JOIN client_service_request_comments comment
		  ON comment.id = file.service_request_comment_id
		WHERE file.id = $1
		  AND comment.id = $2
		  AND comment.service_request_id = $3
		`,
		input.FileID,
		input.CommentID,
		input.ServiceRequestID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ErrNotFound
		}
		return mapClientPortalPersistenceError(err)
	}

	authorized := false
	if input.AuthorUserID != "" && strings.EqualFold(strings.TrimSpace(owner.UserID), input.AuthorUserID) {
		authorized = true
	}
	if input.AuthorClientID != "" && strings.EqualFold(strings.TrimSpace(owner.ClientID), input.AuthorClientID) {
		authorized = true
	}
	if !authorized {
		return usecase.ErrUnauthorized
	}

	result, err := r.db.ExecContext(
		ctx,
		`
		DELETE FROM client_service_request_comment_files
		WHERE id = $1
		  AND service_request_comment_id = $2
		`,
		input.FileID,
		input.CommentID,
	)
	if err != nil {
		return mapClientPortalPersistenceError(err)
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return mapClientPortalPersistenceError(err)
	}
	if affectedRows == 0 {
		return usecase.ErrNotFound
	}

	return nil
}

func (r *ClientPortalRepository) DeleteServiceRequestComment(
	ctx context.Context,
	input usecase.DeleteServiceRequestCommentInput,
) error {
	var owner struct {
		UserID   string `db:"user_id"`
		ClientID string `db:"client_id"`
	}
	if err := r.db.GetContext(
		ctx,
		&owner,
		`
		SELECT
		  COALESCE(comment.user_id::text, '') AS user_id,
		  COALESCE(comment.client_id::text, '') AS client_id
		FROM client_service_request_comments comment
		WHERE comment.id = $1
		  AND comment.service_request_id = $2
		`,
		input.CommentID,
		input.ServiceRequestID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ErrNotFound
		}
		return mapClientPortalPersistenceError(err)
	}

	authorized := false
	if input.AuthorUserID != "" && strings.EqualFold(strings.TrimSpace(owner.UserID), input.AuthorUserID) {
		authorized = true
	}
	if input.AuthorClientID != "" && strings.EqualFold(strings.TrimSpace(owner.ClientID), input.AuthorClientID) {
		authorized = true
	}
	if !authorized {
		return usecase.ErrUnauthorized
	}

	result, err := r.db.ExecContext(
		ctx,
		`
		DELETE FROM client_service_request_comments
		WHERE id = $1
		  AND service_request_id = $2
		`,
		input.CommentID,
		input.ServiceRequestID,
	)
	if err != nil {
		return mapClientPortalPersistenceError(err)
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return mapClientPortalPersistenceError(err)
	}
	if affectedRows == 0 {
		return usecase.ErrNotFound
	}

	return nil
}

func (r *ClientPortalRepository) UpdateServiceRequestComment(
	ctx context.Context,
	input usecase.UpdateServiceRequestCommentInput,
) error {
	var owner struct {
		UserID   string `db:"user_id"`
		ClientID string `db:"client_id"`
	}
	if err := r.db.GetContext(
		ctx,
		&owner,
		`
		SELECT
		  COALESCE(comment.user_id::text, '') AS user_id,
		  COALESCE(comment.client_id::text, '') AS client_id
		FROM client_service_request_comments comment
		WHERE comment.id = $1
		  AND comment.service_request_id = $2
		`,
		input.CommentID,
		input.ServiceRequestID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ErrNotFound
		}
		return mapClientPortalPersistenceError(err)
	}

	authorized := false
	if input.AuthorUserID != "" && strings.EqualFold(strings.TrimSpace(owner.UserID), input.AuthorUserID) {
		authorized = true
	}
	if input.AuthorClientID != "" && strings.EqualFold(strings.TrimSpace(owner.ClientID), input.AuthorClientID) {
		authorized = true
	}
	if !authorized {
		return usecase.ErrUnauthorized
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(
		ctx,
		`
		UPDATE client_service_request_comments
		SET comment = $1,
		    updated = NOW()
		WHERE id = $2
		  AND service_request_id = $3
		`,
		input.Comment,
		input.CommentID,
		input.ServiceRequestID,
	)
	if err != nil {
		return mapClientPortalPersistenceError(err)
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return mapClientPortalPersistenceError(err)
	}
	if affectedRows == 0 {
		return usecase.ErrNotFound
	}

	for _, file := range input.Files {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO client_service_request_comment_files (
			  service_request_comment_id,
			  file_name,
			  file_key,
			  content_type,
			  notes,
			  created,
			  updated
			)
			VALUES (
			  $1,
			  $2,
			  $3,
			  $4,
			  $5,
			  NOW(),
			  NOW()
			)
			`,
			input.CommentID,
			file.FileName,
			file.FileKey,
			file.ContentType,
			file.Notes,
		); err != nil {
			return mapClientPortalPersistenceError(err)
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (r *ClientPortalRepository) CreateServiceRequestComment(
	ctx context.Context,
	input usecase.CreateServiceRequestCommentInput,
) (usecase.ServiceRequestComment, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ServiceRequestComment{}, err
	}
	defer tx.Rollback()

	var requestExists bool
	if err := tx.GetContext(
		ctx,
		&requestExists,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM client_service_requests request
		  WHERE request.id = $1
		)
		`,
		input.ServiceRequestID,
	); err != nil {
		return usecase.ServiceRequestComment{}, err
	}
	if !requestExists {
		return usecase.ServiceRequestComment{}, usecase.ErrNotFound
	}

	if input.ParentCommentID != "" {
		var parentExists bool
		if err := tx.GetContext(
			ctx,
			&parentExists,
			`
			SELECT EXISTS (
			  SELECT 1
			  FROM client_service_request_comments comment
			  WHERE comment.id = $1
			    AND comment.service_request_id = $2
			)
			`,
			input.ParentCommentID,
			input.ServiceRequestID,
		); err != nil {
			return usecase.ServiceRequestComment{}, mapClientPortalPersistenceError(err)
		}
		if !parentExists {
			return usecase.ServiceRequestComment{}, usecase.ErrInvalidInput
		}
	}

	var commentID string
	if err := tx.GetContext(
		ctx,
		&commentID,
		`
		INSERT INTO client_service_request_comments (
		  service_request_id,
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
		input.ServiceRequestID,
		input.ParentCommentID,
		input.AuthorUserID,
		input.AuthorClientID,
		input.Comment,
	); err != nil {
		return usecase.ServiceRequestComment{}, mapClientPortalPersistenceError(err)
	}

	for _, file := range input.Files {
		if _, err := tx.ExecContext(
			ctx,
			`
			INSERT INTO client_service_request_comment_files (
			  service_request_comment_id,
			  file_name,
			  file_key,
			  content_type,
			  notes,
			  created,
			  updated
			)
			VALUES (
			  $1,
			  $2,
			  $3,
			  $4,
			  $5,
			  NOW(),
			  NOW()
			)
			`,
			commentID,
			file.FileName,
			file.FileKey,
			file.ContentType,
			file.Notes,
		); err != nil {
			return usecase.ServiceRequestComment{}, mapClientPortalPersistenceError(err)
		}
	}

	if _, err := tx.ExecContext(
		ctx,
		`
		UPDATE client_service_requests
		SET status = CASE
		      WHEN status = 'aberta' THEN 'em_andamento'
		      ELSE status
		    END,
		    updated = NOW()
		WHERE id = $1
		`,
		input.ServiceRequestID,
	); err != nil {
		return usecase.ServiceRequestComment{}, mapClientPortalPersistenceError(err)
	}

	if err := tx.Commit(); err != nil {
		return usecase.ServiceRequestComment{}, err
	}

	comments, err := r.ListServiceRequestComments(ctx, input.ServiceRequestID)
	if err != nil {
		return usecase.ServiceRequestComment{}, err
	}
	for _, comment := range comments {
		if comment.ID == commentID {
			return comment, nil
		}
	}

	return usecase.ServiceRequestComment{}, usecase.ErrNotFound
}

func (r *ClientPortalRepository) serviceRequestExists(
	ctx context.Context,
	requestID string,
) (bool, error) {
	var exists bool
	if err := r.db.GetContext(
		ctx,
		&exists,
		`
		SELECT EXISTS (
		  SELECT 1
		  FROM client_service_requests request
		  WHERE request.id = $1
		)
		`,
		requestID,
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return false, nil
		}
		return false, err
	}

	return exists, nil
}

func (r *ClientPortalRepository) listServiceRequestFiles(
	ctx context.Context,
	requestID string,
) ([]usecase.ClientServiceRequestFile, error) {
	var records []clientServiceRequestFileRecord
	if err := r.db.SelectContext(
		ctx,
		&records,
		`
		SELECT
		  file.id,
		  file.service_request_id AS request_id,
		  file.file_name,
		  file.file_key,
		  file.content_type,
		  file.notes,
		  file.created,
		  file.updated
		FROM client_service_request_files file
		WHERE file.service_request_id = $1
		ORDER BY file.created ASC, file.id ASC
		`,
		requestID,
	); err != nil {
		if isUndefinedRelationOrColumn(err) {
			return []usecase.ClientServiceRequestFile{}, nil
		}
		return nil, err
	}

	files := make([]usecase.ClientServiceRequestFile, 0, len(records))
	for _, record := range records {
		files = append(files, usecase.ClientServiceRequestFile{
			ID:          record.ID,
			FileName:    record.FileName,
			FileKey:     record.FileKey,
			ContentType: record.ContentType,
			Notes:       record.Notes,
			Created:     record.Created,
			Updated:     record.Updated,
		})
	}

	return files, nil
}

func mapClientPortalAuthRecord(record clientPortalAuthRecord) usecase.ClientPortalAuthUser {
	return usecase.ClientPortalAuthUser{
		ID:       record.ID,
		Name:     record.Name,
		Email:    record.Email,
		Login:    record.Login,
		Password: record.Password,
		Avatar:   record.Avatar,
		Active:   record.Active,
	}
}

func mapClientPortalAccountRecord(record clientPortalAccountRecord) usecase.ClientPortalAccount {
	return usecase.ClientPortalAccount{
		ID:      record.ID,
		Name:    record.Name,
		Email:   record.Email,
		Login:   record.Login,
		Avatar:  record.Avatar,
		Active:  record.Active,
		Created: record.Created,
		Updated: record.Updated,
	}
}

func mapAdminServiceRequestRecord(record adminServiceRequestRecord) usecase.AdminServiceRequest {
	return usecase.AdminServiceRequest{
		ID:           record.ID,
		ClientID:     record.ClientID,
		ClientName:   record.ClientName,
		ClientEmail:  record.ClientEmail,
		ClientLogin:  record.ClientLogin,
		ProjectID:    strings.TrimSpace(record.ProjectID),
		ProjectName:  record.ProjectName,
		Title:        record.Title,
		Description:  record.Description,
		Status:       normalizeServiceRequestStatus(record.Status),
		Files:        []usecase.ClientServiceRequestFile{},
		Comments:     record.Comments,
		OpenComments: record.OpenComments,
		Created:      record.Created,
		Updated:      record.Updated,
	}
}

func mapClientPortalPersistenceError(err error) error {
	mappedClientError := mapClientPersistenceError(err)
	if mappedClientError != err {
		return mappedClientError
	}

	var pgErr *pq.Error
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "22P02":
			return usecase.ErrInvalidInput
		case "23503":
			return usecase.ErrNotFound
		}
	}

	return err
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

func normalizeServiceRequestStatus(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "aberta", "em_andamento", "concluida", "cancelada":
		return normalized
	default:
		return "aberta"
	}
}
