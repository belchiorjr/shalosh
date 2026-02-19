package servicerequests

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

type Handler struct {
	clientPortalService *usecase.ClientPortalService
	authorizeRequest    func(r *http.Request) (infraauth.Claims, error)
	respondJSON         func(w http.ResponseWriter, status int, payload interface{})
	respondError        func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	clientPortalService *usecase.ClientPortalService,
	authorizeRequest func(r *http.Request) (infraauth.Claims, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		clientPortalService: clientPortalService,
		authorizeRequest:    authorizeRequest,
		respondJSON:         respondJSON,
		respondError:        respondError,
	}
}

type relatedFilePayload struct {
	FileName    string `json:"fileName"`
	FileKey     string `json:"fileKey"`
	ContentType string `json:"contentType"`
	Notes       string `json:"notes"`
}

func (h *Handler) HandleServiceRequests(w http.ResponseWriter, r *http.Request) {
	claims, err := h.authorizeRequest(r)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	trimmedPath := strings.TrimPrefix(r.URL.Path, "/service-requests")
	trimmedPath = strings.Trim(trimmedPath, "/")
	if trimmedPath == "" {
		h.handleServiceRequestCollection(w, r)
		return
	}

	segments := strings.Split(trimmedPath, "/")
	requestID := strings.TrimSpace(segments[0])
	if requestID == "" {
		h.respondError(w, http.StatusNotFound, "service request not found")
		return
	}

	if len(segments) == 1 {
		h.handleServiceRequestByID(w, r, requestID)
		return
	}

	if len(segments) == 2 && strings.EqualFold(strings.TrimSpace(segments[1]), "status") {
		h.handleServiceRequestStatus(w, r, requestID)
		return
	}

	if len(segments) == 2 && strings.EqualFold(strings.TrimSpace(segments[1]), "comments") {
		h.handleServiceRequestComments(w, r, requestID, claims.Sub)
		return
	}

	if len(segments) == 3 && strings.EqualFold(strings.TrimSpace(segments[1]), "comments") {
		commentID := strings.TrimSpace(segments[2])
		if commentID == "" {
			h.respondError(w, http.StatusNotFound, "resource not found")
			return
		}
		h.handleServiceRequestComment(w, r, requestID, commentID, claims.Sub)
		return
	}

	if len(segments) == 5 &&
		strings.EqualFold(strings.TrimSpace(segments[1]), "comments") &&
		strings.EqualFold(strings.TrimSpace(segments[3]), "files") {
		commentID := strings.TrimSpace(segments[2])
		fileID := strings.TrimSpace(segments[4])
		if commentID == "" || fileID == "" {
			h.respondError(w, http.StatusNotFound, "resource not found")
			return
		}
		h.handleServiceRequestCommentFile(w, r, requestID, commentID, fileID, claims.Sub)
		return
	}

	h.respondError(w, http.StatusNotFound, "route not found")
}

func (h *Handler) handleServiceRequestCollection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	requests, err := h.clientPortalService.ListAdminServiceRequests(r.Context())
	if err != nil {
		h.handleUsecaseError(w, err, "")
		return
	}

	h.respondJSON(w, http.StatusOK, requests)
}

func (h *Handler) handleServiceRequestByID(
	w http.ResponseWriter,
	r *http.Request,
	requestID string,
) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	request, err := h.clientPortalService.GetAdminServiceRequest(r.Context(), requestID)
	if err != nil {
		h.handleUsecaseError(w, err, "")
		return
	}

	h.respondJSON(w, http.StatusOK, request)
}

func (h *Handler) handleServiceRequestStatus(
	w http.ResponseWriter,
	r *http.Request,
	requestID string,
) {
	if r.Method != http.MethodPatch {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Status string `json:"status"`
	}
	if err := decodeJSONBody(r, &payload); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid json")
		return
	}

	request, err := h.clientPortalService.UpdateAdminServiceRequestStatus(
		r.Context(),
		usecase.UpdateAdminServiceRequestStatusInput{
			RequestID: requestID,
			Status:    payload.Status,
		},
	)
	if err != nil {
		h.handleUsecaseError(w, err, "status must be concluida or cancelada")
		return
	}

	h.respondJSON(w, http.StatusOK, request)
}

func (h *Handler) handleServiceRequestComments(
	w http.ResponseWriter,
	r *http.Request,
	requestID string,
	authorUserID string,
) {
	switch r.Method {
	case http.MethodGet:
		comments, err := h.clientPortalService.ListServiceRequestComments(r.Context(), requestID)
		if err != nil {
			h.handleUsecaseError(w, err, "")
			return
		}

		h.respondJSON(w, http.StatusOK, comments)
	case http.MethodPost:
		var payload struct {
			ParentCommentID string               `json:"parentCommentId"`
			Comment         string               `json:"comment"`
			Files           []relatedFilePayload `json:"files"`
		}
		if err := decodeJSONBody(r, &payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		comment, err := h.clientPortalService.CreateServiceRequestComment(
			r.Context(),
			usecase.CreateServiceRequestCommentInput{
				ServiceRequestID: requestID,
				ParentCommentID:  payload.ParentCommentID,
				AuthorUserID:     authorUserID,
				Comment:          payload.Comment,
				Files:            mapServiceRequestCommentFiles(payload.Files),
			},
		)
		if err != nil {
			h.handleUsecaseError(w, err, "comment is required")
			return
		}

		h.respondJSON(w, http.StatusCreated, comment)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *Handler) handleServiceRequestComment(
	w http.ResponseWriter,
	r *http.Request,
	requestID string,
	commentID string,
	authorUserID string,
) {
	switch r.Method {
	case http.MethodPatch:
		var payload struct {
			Comment string               `json:"comment"`
			Files   []relatedFilePayload `json:"files"`
		}
		if err := decodeJSONBody(r, &payload); err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid json")
			return
		}

		err := h.clientPortalService.UpdateServiceRequestComment(
			r.Context(),
			usecase.UpdateServiceRequestCommentInput{
				ServiceRequestID: requestID,
				CommentID:        commentID,
				AuthorUserID:     authorUserID,
				Comment:          payload.Comment,
				Files:            mapServiceRequestCommentFiles(payload.Files),
			},
		)
		if err != nil {
			h.handleUsecaseError(w, err, "comment is required")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	case http.MethodDelete:
		err := h.clientPortalService.DeleteServiceRequestComment(
			r.Context(),
			usecase.DeleteServiceRequestCommentInput{
				ServiceRequestID: requestID,
				CommentID:        commentID,
				AuthorUserID:     authorUserID,
			},
		)
		if err != nil {
			h.handleUsecaseError(w, err, "")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (h *Handler) handleServiceRequestCommentFile(
	w http.ResponseWriter,
	r *http.Request,
	requestID string,
	commentID string,
	fileID string,
	authorUserID string,
) {
	if r.Method != http.MethodDelete {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	err := h.clientPortalService.DeleteServiceRequestCommentFile(
		r.Context(),
		usecase.DeleteServiceRequestCommentFileInput{
			ServiceRequestID: requestID,
			CommentID:        commentID,
			FileID:           fileID,
			AuthorUserID:     authorUserID,
		},
	)
	if err != nil {
		h.handleUsecaseError(w, err, "")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) handleUsecaseError(
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
	case errors.Is(err, usecase.ErrUnauthorized):
		h.respondError(w, http.StatusForbidden, "forbidden")
	case errors.Is(err, usecase.ErrNotFound):
		h.respondError(w, http.StatusNotFound, "resource not found")
	case errors.Is(err, usecase.ErrConflict):
		h.respondError(w, http.StatusConflict, "conflict")
	default:
		h.respondError(w, http.StatusInternalServerError, "unexpected error")
	}
}

func mapServiceRequestCommentFiles(
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

func decodeJSONBody(r *http.Request, target interface{}) error {
	return json.NewDecoder(r.Body).Decode(target)
}
