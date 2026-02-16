package http

import (
	"encoding/base64"
	"errors"
	"strings"
)

const maxAvatarBytes = 1 * 1024 * 1024

func normalizeAvatarInput(value string) (string, error) {
	avatar := strings.TrimSpace(value)
	if avatar == "" {
		return "", nil
	}

	avatarLower := strings.ToLower(avatar)
	if !strings.HasPrefix(avatarLower, "data:image/") {
		return "", errors.New("avatar must be an image data URL")
	}

	parts := strings.SplitN(avatar, ",", 2)
	if len(parts) != 2 {
		return "", errors.New("avatar image format is invalid")
	}

	meta := strings.ToLower(parts[0])
	if !strings.Contains(meta, ";base64") {
		return "", errors.New("avatar image format is invalid")
	}

	allowedMimes := []string{
		"data:image/png",
		"data:image/jpeg",
		"data:image/jpg",
		"data:image/webp",
		"data:image/gif",
	}

	isAllowedMime := false
	for _, allowedMime := range allowedMimes {
		if strings.HasPrefix(meta, allowedMime) {
			isAllowedMime = true
			break
		}
	}
	if !isAllowedMime {
		return "", errors.New("avatar image type is not supported")
	}

	encodedData := parts[1]
	decoded, err := base64.StdEncoding.DecodeString(encodedData)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(encodedData)
		if err != nil {
			return "", errors.New("avatar image is invalid")
		}
	}

	if len(decoded) > maxAvatarBytes {
		return "", errors.New("avatar image exceeds 1MB")
	}

	return avatar, nil
}
