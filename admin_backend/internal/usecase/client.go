package usecase

import (
	"context"
	"regexp"
	"strings"
	"time"
)

var nonDigitPattern = regexp.MustCompile(`\D`)

var allowedStreetTypes = map[string]struct{}{
	"":         {},
	"rua":      {},
	"avenida":  {},
	"travessa": {},
	"alameda":  {},
	"rodovia":  {},
	"outro":    {},
}

type ClientRepository interface {
	List(ctx context.Context, onlyActive bool) ([]ClientListItem, error)
	GetDetail(ctx context.Context, clientID string) (ClientDetail, error)
	Create(ctx context.Context, input CreateClientInput) (ClientDetail, error)
	Update(ctx context.Context, input UpdateClientInput) (ClientDetail, error)
	Deactivate(ctx context.Context, clientID string) (ClientDetail, error)
}

type ZipCodeLookup interface {
	Lookup(ctx context.Context, zipCode string) (ZipCodeLookupResult, error)
}

type ClientService struct {
	repo          ClientRepository
	zipCodeLookup ZipCodeLookup
}

func NewClientService(repo ClientRepository, zipCodeLookup ZipCodeLookup) *ClientService {
	return &ClientService{
		repo:          repo,
		zipCodeLookup: zipCodeLookup,
	}
}

type ClientListItem struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Login          string    `json:"login"`
	Avatar         string    `json:"avatar"`
	Phone          string    `json:"phone"`
	Address        string    `json:"address"`
	Active         bool      `json:"active"`
	AddressesCount int       `json:"addressesCount"`
	PhonesCount    int       `json:"phonesCount"`
	Created        time.Time `json:"created"`
	Updated        time.Time `json:"updated"`
}

type ClientAddress struct {
	ID           string    `json:"id"`
	ClientID     string    `json:"clientId"`
	Label        string    `json:"label"`
	Country      string    `json:"country"`
	ZipCode      string    `json:"zipCode"`
	StreetType   string    `json:"streetType"`
	StreetName   string    `json:"streetName"`
	Street       string    `json:"street"`
	Number       string    `json:"number"`
	Neighborhood string    `json:"neighborhood"`
	City         string    `json:"city"`
	State        string    `json:"state"`
	Complement   string    `json:"complement"`
	Latitude     *float64  `json:"latitude,omitempty"`
	Longitude    *float64  `json:"longitude,omitempty"`
	Position     int       `json:"position"`
	Active       bool      `json:"active"`
	Created      time.Time `json:"created"`
	Updated      time.Time `json:"updated"`
}

type ClientPhone struct {
	ID          string    `json:"id"`
	ClientID    string    `json:"clientId"`
	Label       string    `json:"label"`
	PhoneNumber string    `json:"phoneNumber"`
	IsWhatsapp  bool      `json:"isWhatsapp"`
	Position    int       `json:"position"`
	Active      bool      `json:"active"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
}

type ClientDetail struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Email     string          `json:"email"`
	Login     string          `json:"login"`
	Avatar    string          `json:"avatar"`
	Active    bool            `json:"active"`
	Created   time.Time       `json:"created"`
	Updated   time.Time       `json:"updated"`
	Addresses []ClientAddress `json:"addresses"`
	Phones    []ClientPhone   `json:"phones"`
}

type ClientAddressInput struct {
	Label        string
	Country      string
	ZipCode      string
	StreetType   string
	StreetName   string
	Street       string
	Number       string
	Neighborhood string
	City         string
	State        string
	Complement   string
	Latitude     *float64
	Longitude    *float64
	Position     *int
	Active       *bool
}

type ClientPhoneInput struct {
	Label       string
	PhoneNumber string
	IsWhatsapp  *bool
	Position    *int
	Active      *bool
}

type CreateClientInput struct {
	Name      string
	Email     string
	Login     string
	Password  string
	Avatar    string
	Active    bool
	Addresses []ClientAddressInput
	Phones    []ClientPhoneInput
}

type UpdateClientInput struct {
	ID        string
	Name      string
	Email     string
	Login     string
	Password  string
	Avatar    string
	Active    *bool
	Addresses *[]ClientAddressInput
	Phones    *[]ClientPhoneInput
}

type ZipCodeLookupResult struct {
	ZipCode      string `json:"zipCode"`
	Street       string `json:"street"`
	Complement   string `json:"complement"`
	Neighborhood string `json:"neighborhood"`
	City         string `json:"city"`
	State        string `json:"state"`
	IBGE         string `json:"ibge"`
	GIA          string `json:"gia"`
	DDD          string `json:"ddd"`
	SIAFI        string `json:"siafi"`
}

func (s *ClientService) List(ctx context.Context, onlyActive bool) ([]ClientListItem, error) {
	return s.repo.List(ctx, onlyActive)
}

func (s *ClientService) GetDetail(ctx context.Context, clientID string) (ClientDetail, error) {
	id := strings.TrimSpace(clientID)
	if id == "" {
		return ClientDetail{}, ErrInvalidInput
	}

	return s.repo.GetDetail(ctx, id)
}

func (s *ClientService) Create(ctx context.Context, input CreateClientInput) (ClientDetail, error) {
	normalizedInput, err := normalizeCreateClientInput(input)
	if err != nil {
		return ClientDetail{}, err
	}

	return s.repo.Create(ctx, normalizedInput)
}

func (s *ClientService) Update(ctx context.Context, input UpdateClientInput) (ClientDetail, error) {
	normalizedInput, err := normalizeUpdateClientInput(input)
	if err != nil {
		return ClientDetail{}, err
	}

	return s.repo.Update(ctx, normalizedInput)
}

func (s *ClientService) Deactivate(ctx context.Context, clientID string) (ClientDetail, error) {
	id := strings.TrimSpace(clientID)
	if id == "" {
		return ClientDetail{}, ErrInvalidInput
	}

	return s.repo.Deactivate(ctx, id)
}

func (s *ClientService) LookupZipCode(ctx context.Context, zipCode string) (ZipCodeLookupResult, error) {
	if s.zipCodeLookup == nil {
		return ZipCodeLookupResult{}, ErrZipCodeUnavailable
	}

	normalizedZipCode := nonDigitPattern.ReplaceAllString(strings.TrimSpace(zipCode), "")
	if len(normalizedZipCode) != 8 {
		return ZipCodeLookupResult{}, ErrInvalidInput
	}

	return s.zipCodeLookup.Lookup(ctx, normalizedZipCode)
}

func normalizeCreateClientInput(input CreateClientInput) (CreateClientInput, error) {
	normalizedAddresses, err := normalizeAddressInputs(input.Addresses)
	if err != nil {
		return CreateClientInput{}, err
	}

	normalizedPhones := normalizePhoneInputs(input.Phones)

	normalizedInput := CreateClientInput{
		Name:      strings.TrimSpace(input.Name),
		Email:     strings.TrimSpace(input.Email),
		Login:     strings.ToLower(strings.TrimSpace(input.Login)),
		Password:  strings.TrimSpace(input.Password),
		Avatar:    strings.TrimSpace(input.Avatar),
		Active:    input.Active,
		Addresses: normalizedAddresses,
		Phones:    normalizedPhones,
	}

	if normalizedInput.Name == "" ||
		normalizedInput.Email == "" ||
		normalizedInput.Login == "" ||
		normalizedInput.Password == "" {
		return CreateClientInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeUpdateClientInput(input UpdateClientInput) (UpdateClientInput, error) {
	var normalizedAddresses *[]ClientAddressInput
	if input.Addresses != nil {
		addresses, err := normalizeAddressInputs(*input.Addresses)
		if err != nil {
			return UpdateClientInput{}, err
		}
		normalizedAddresses = &addresses
	}

	var normalizedPhones *[]ClientPhoneInput
	if input.Phones != nil {
		phones := normalizePhoneInputs(*input.Phones)
		normalizedPhones = &phones
	}

	normalizedInput := UpdateClientInput{
		ID:        strings.TrimSpace(input.ID),
		Name:      strings.TrimSpace(input.Name),
		Email:     strings.TrimSpace(input.Email),
		Login:     strings.ToLower(strings.TrimSpace(input.Login)),
		Password:  strings.TrimSpace(input.Password),
		Avatar:    strings.TrimSpace(input.Avatar),
		Active:    input.Active,
		Addresses: normalizedAddresses,
		Phones:    normalizedPhones,
	}

	if normalizedInput.ID == "" ||
		normalizedInput.Name == "" ||
		normalizedInput.Email == "" ||
		normalizedInput.Login == "" {
		return UpdateClientInput{}, ErrInvalidInput
	}

	return normalizedInput, nil
}

func normalizeAddressInputs(addresses []ClientAddressInput) ([]ClientAddressInput, error) {
	normalized := make([]ClientAddressInput, 0, len(addresses))

	for _, address := range addresses {
		streetType := normalizeStreetType(address.StreetType)
		streetName := strings.TrimSpace(address.StreetName)
		street := strings.TrimSpace(address.Street)
		if streetName == "" {
			inferredStreetType, inferredStreetName := splitStreet(street)
			if streetType == "" {
				streetType = inferredStreetType
			}
			streetName = inferredStreetName
		}
		if street == "" {
			street = composeStreet(streetType, streetName)
		}
		country := strings.TrimSpace(address.Country)
		if country == "" {
			country = "Brasil"
		}

		normalizedAddress := ClientAddressInput{
			Label:        strings.TrimSpace(address.Label),
			Country:      country,
			ZipCode:      nonDigitPattern.ReplaceAllString(strings.TrimSpace(address.ZipCode), ""),
			StreetType:   streetType,
			StreetName:   streetName,
			Street:       strings.TrimSpace(address.Street),
			Number:       strings.TrimSpace(address.Number),
			Neighborhood: strings.TrimSpace(address.Neighborhood),
			City:         strings.TrimSpace(address.City),
			State:        strings.ToUpper(strings.TrimSpace(address.State)),
			Complement:   strings.TrimSpace(address.Complement),
			Latitude:     address.Latitude,
			Longitude:    address.Longitude,
			Position:     address.Position,
			Active:       address.Active,
		}

		if normalizedAddress.ZipCode != "" && len(normalizedAddress.ZipCode) != 8 {
			return nil, ErrInvalidInput
		}
		if _, ok := allowedStreetTypes[normalizedAddress.StreetType]; !ok {
			return nil, ErrInvalidInput
		}
		if normalizedAddress.Street == "" && normalizedAddress.StreetName != "" {
			normalizedAddress.Street = composeStreet(
				normalizedAddress.StreetType,
				normalizedAddress.StreetName,
			)
		}
		if normalizedAddress.Street == "" {
			normalizedAddress.Street = street
		}
		if normalizedAddress.StreetName == "" {
			_, inferredStreetName := splitStreet(normalizedAddress.Street)
			normalizedAddress.StreetName = inferredStreetName
		}

		normalized = append(normalized, normalizedAddress)
	}

	return normalized, nil
}

func normalizeStreetType(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch normalized {
	case "", "rua":
		return normalized
	case "av", "av.", "avenida":
		return "avenida"
	case "trav", "trav.", "tv", "tv.", "travessa":
		return "travessa"
	case "al", "al.", "alameda":
		return "alameda"
	case "rod", "rod.", "rodovia":
		return "rodovia"
	case "outro", "outra":
		return "outro"
	default:
		return normalized
	}
}

func splitStreet(street string) (string, string) {
	normalizedStreet := strings.TrimSpace(street)
	if normalizedStreet == "" {
		return "", ""
	}

	lowered := strings.ToLower(normalizedStreet)
	switch {
	case strings.HasPrefix(lowered, "rua "):
		return "rua", strings.TrimSpace(normalizedStreet[4:])
	case strings.HasPrefix(lowered, "avenida "):
		return "avenida", strings.TrimSpace(normalizedStreet[8:])
	case strings.HasPrefix(lowered, "av. "):
		return "avenida", strings.TrimSpace(normalizedStreet[4:])
	case strings.HasPrefix(lowered, "av "):
		return "avenida", strings.TrimSpace(normalizedStreet[3:])
	case strings.HasPrefix(lowered, "travessa "):
		return "travessa", strings.TrimSpace(normalizedStreet[9:])
	case strings.HasPrefix(lowered, "tv. "):
		return "travessa", strings.TrimSpace(normalizedStreet[4:])
	case strings.HasPrefix(lowered, "tv "):
		return "travessa", strings.TrimSpace(normalizedStreet[3:])
	case strings.HasPrefix(lowered, "alameda "):
		return "alameda", strings.TrimSpace(normalizedStreet[8:])
	case strings.HasPrefix(lowered, "rodovia "):
		return "rodovia", strings.TrimSpace(normalizedStreet[8:])
	default:
		return "", normalizedStreet
	}
}

func composeStreet(streetType, streetName string) string {
	name := strings.TrimSpace(streetName)
	if name == "" {
		return ""
	}

	switch normalizeStreetType(streetType) {
	case "rua":
		return "Rua " + name
	case "avenida":
		return "Avenida " + name
	case "travessa":
		return "Travessa " + name
	case "alameda":
		return "Alameda " + name
	case "rodovia":
		return "Rodovia " + name
	default:
		return name
	}
}

func normalizePhoneInputs(phones []ClientPhoneInput) []ClientPhoneInput {
	normalized := make([]ClientPhoneInput, 0, len(phones))

	for _, phone := range phones {
		normalized = append(normalized, ClientPhoneInput{
			Label:       strings.TrimSpace(phone.Label),
			PhoneNumber: strings.TrimSpace(phone.PhoneNumber),
			IsWhatsapp:  phone.IsWhatsapp,
			Position:    phone.Position,
			Active:      phone.Active,
		})
	}

	return normalized
}
