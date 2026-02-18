package usecase

import "errors"

var (
	ErrNotFound     = errors.New("not found")
	ErrInvalidInput = errors.New("invalid input")
	ErrConflict     = errors.New("conflict")
	ErrUnauthorized = errors.New("unauthorized")

	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrLoginInUse         = errors.New("login already in use")
	ErrEmailInUse         = errors.New("email already in use")

	ErrClientLoginInUse = errors.New("client login already in use")
	ErrClientEmailInUse = errors.New("client email already in use")

	ErrPermissionCodeInUse = errors.New("permission code already in use")
	ErrPermissionNameInUse = errors.New("permission name already in use")
	ErrProfileNameInUse    = errors.New("profile name already in use")
	ErrProfilesNotFound    = errors.New("one or more profiles do not exist")
	ErrPermissionsNotFound = errors.New("one or more permissions do not exist")

	ErrProjectNameInUse        = errors.New("project name already in use")
	ErrProjectTypeCodeInUse    = errors.New("project type code already in use")
	ErrProjectTypeNameInUse    = errors.New("project type name already in use")
	ErrProjectTypeNotFound     = errors.New("project type not found")
	ErrProjectCategoryNotFound = errors.New("project category not found")
	ErrProjectClientsNotFound  = errors.New("one or more project clients do not exist")
	ErrProjectManagersNotFound = errors.New("one or more project managers do not exist")

	ErrZipCodeUnavailable = errors.New("zipcode service unavailable")
	ErrZipCodeNotFound    = errors.New("zipcode not found")
)
