package clients

import (
	"context"
	"net/http"

	infraauth "admin_backend/internal/infra/auth"
	"admin_backend/internal/usecase"
)

type Handler struct {
	clientService        *usecase.ClientService
	authorizeRequest     func(r *http.Request) (infraauth.Claims, error)
	hasUserPermission    func(ctx context.Context, userID, permissionCode string) (bool, error)
	normalizeAvatarInput func(value string) (string, error)
	respondJSON          func(w http.ResponseWriter, status int, payload interface{})
	respondError         func(w http.ResponseWriter, status int, message string)
}

func NewHandler(
	clientService *usecase.ClientService,
	authorizeRequest func(r *http.Request) (infraauth.Claims, error),
	hasUserPermission func(ctx context.Context, userID, permissionCode string) (bool, error),
	normalizeAvatarInput func(value string) (string, error),
	respondJSON func(w http.ResponseWriter, status int, payload interface{}),
	respondError func(w http.ResponseWriter, status int, message string),
) *Handler {
	return &Handler{
		clientService:        clientService,
		authorizeRequest:     authorizeRequest,
		hasUserPermission:    hasUserPermission,
		normalizeAvatarInput: normalizeAvatarInput,
		respondJSON:          respondJSON,
		respondError:         respondError,
	}
}

const (
	permissionClientsCreate         = "clients.create"
	permissionClientsRead           = "clients.read"
	permissionClientsUpdate         = "clients.update"
	permissionClientsDelete         = "clients.delete"
	permissionClientAddressesCreate = "client_addresses.create"
	permissionClientAddressesUpdate = "client_addresses.update"
	permissionClientPhonesCreate    = "client_phones.create"
	permissionClientPhonesUpdate    = "client_phones.update"
	permissionClientsPasswordUpdate = "clients.password.update"
)

type addressPayload struct {
	Label        string   `json:"label"`
	Country      string   `json:"country"`
	ZipCode      string   `json:"zipCode"`
	StreetType   string   `json:"streetType"`
	StreetName   string   `json:"streetName"`
	Street       string   `json:"street"`
	Number       string   `json:"number"`
	Neighborhood string   `json:"neighborhood"`
	City         string   `json:"city"`
	State        string   `json:"state"`
	Complement   string   `json:"complement"`
	Latitude     *float64 `json:"latitude"`
	Longitude    *float64 `json:"longitude"`
	Position     *int     `json:"position"`
	Active       *bool    `json:"active"`
}

type phonePayload struct {
	Label       string `json:"label"`
	PhoneNumber string `json:"phoneNumber"`
	IsWhatsapp  *bool  `json:"isWhatsapp"`
	Position    *int   `json:"position"`
	Active      *bool  `json:"active"`
}
