package projects

import (
	"strings"
	"time"

	"admin_backend/internal/usecase"
)

type relatedFilePayload struct {
	FileName    string `json:"fileName"`
	FileKey     string `json:"fileKey"`
	ContentType string `json:"contentType"`
	Notes       string `json:"notes"`
}

type revenueReceiptPayload struct {
	FileName    string `json:"fileName"`
	FileKey     string `json:"fileKey"`
	ContentType string `json:"contentType"`
	IssuedOn    string `json:"issuedOn"`
	Notes       string `json:"notes"`
}

func parseOptionalDate(value string) (*time.Time, error) {
	raw := strings.TrimSpace(value)
	if raw == "" {
		return nil, nil
	}

	parsed, err := time.Parse("2006-01-02", raw)
	if err == nil {
		return &parsed, nil
	}

	rfc3339Date, rfcErr := time.Parse(time.RFC3339, raw)
	if rfcErr != nil {
		return nil, err
	}

	return &rfc3339Date, nil
}

func mapRelatedFilePayloads(payloads []relatedFilePayload) []usecase.CreateProjectFileInput {
	files := make([]usecase.CreateProjectFileInput, 0, len(payloads))
	for _, payload := range payloads {
		files = append(files, usecase.CreateProjectFileInput{
			FileName:    payload.FileName,
			FileKey:     payload.FileKey,
			ContentType: payload.ContentType,
			Notes:       payload.Notes,
		})
	}

	return files
}

func mapRevenueReceiptPayloads(
	payloads []revenueReceiptPayload,
) ([]usecase.CreateProjectRevenueReceiptInput, error) {
	receipts := make([]usecase.CreateProjectRevenueReceiptInput, 0, len(payloads))
	for _, payload := range payloads {
		issuedOn, err := parseOptionalDate(payload.IssuedOn)
		if err != nil {
			return nil, err
		}

		receipts = append(receipts, usecase.CreateProjectRevenueReceiptInput{
			FileName:    payload.FileName,
			FileKey:     payload.FileKey,
			ContentType: payload.ContentType,
			IssuedOn:    issuedOn,
			Notes:       payload.Notes,
		})
	}

	return receipts, nil
}
