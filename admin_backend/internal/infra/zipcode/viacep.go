package zipcode

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"admin_backend/internal/usecase"
)

var nonDigitPattern = regexp.MustCompile(`\D`)

type ViaCEPClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewViaCEPClient(timeout time.Duration) *ViaCEPClient {
	if timeout <= 0 {
		timeout = 8 * time.Second
	}

	return &ViaCEPClient{
		baseURL: "https://viacep.com.br/ws",
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *ViaCEPClient) Lookup(ctx context.Context, zipCode string) (usecase.ZipCodeLookupResult, error) {
	requestURL := fmt.Sprintf("%s/%s/json/", strings.TrimSuffix(c.baseURL, "/"), zipCode)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return usecase.ZipCodeLookupResult{}, usecase.ErrZipCodeUnavailable
	}

	response, err := c.httpClient.Do(req)
	if err != nil {
		return usecase.ZipCodeLookupResult{}, usecase.ErrZipCodeUnavailable
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return usecase.ZipCodeLookupResult{}, usecase.ErrZipCodeUnavailable
	}

	var payload struct {
		CEP          string `json:"cep"`
		Street       string `json:"logradouro"`
		Complement   string `json:"complemento"`
		Neighborhood string `json:"bairro"`
		City         string `json:"localidade"`
		State        string `json:"uf"`
		IBGE         string `json:"ibge"`
		GIA          string `json:"gia"`
		DDD          string `json:"ddd"`
		SIAFI        string `json:"siafi"`
		NotFound     bool   `json:"erro"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return usecase.ZipCodeLookupResult{}, usecase.ErrZipCodeUnavailable
	}

	if payload.NotFound {
		return usecase.ZipCodeLookupResult{}, usecase.ErrZipCodeNotFound
	}

	return usecase.ZipCodeLookupResult{
		ZipCode:      onlyDigits(payload.CEP),
		Street:       strings.TrimSpace(payload.Street),
		Complement:   strings.TrimSpace(payload.Complement),
		Neighborhood: strings.TrimSpace(payload.Neighborhood),
		City:         strings.TrimSpace(payload.City),
		State:        strings.TrimSpace(payload.State),
		IBGE:         strings.TrimSpace(payload.IBGE),
		GIA:          strings.TrimSpace(payload.GIA),
		DDD:          strings.TrimSpace(payload.DDD),
		SIAFI:        strings.TrimSpace(payload.SIAFI),
	}, nil
}

func onlyDigits(value string) string {
	return nonDigitPattern.ReplaceAllString(strings.TrimSpace(value), "")
}
