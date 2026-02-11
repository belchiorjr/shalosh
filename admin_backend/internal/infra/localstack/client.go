package localstack

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	config     Config
	httpClient *http.Client
}

func New(cfg Config) (*Client, error) {
	if strings.TrimSpace(cfg.Endpoint) == "" {
		return nil, fmt.Errorf("localstack endpoint is required")
	}
	if strings.TrimSpace(cfg.Region) == "" {
		return nil, fmt.Errorf("localstack region is required")
	}
	if strings.TrimSpace(cfg.AccessKeyID) == "" || strings.TrimSpace(cfg.SecretAccessKey) == "" {
		return nil, fmt.Errorf("localstack credentials are required")
	}

	return &Client{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 3 * time.Second,
		},
	}, nil
}

func (c *Client) HealthCheck(ctx context.Context) error {
	endpoint := strings.TrimRight(c.config.Endpoint, "/")
	url := endpoint + "/health"

	var lastErr error
	for attempt := 0; attempt < 10; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return fmt.Errorf("localstack health request: %w", err)
		}

		resp, err := c.httpClient.Do(req)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode < http.StatusBadRequest {
				return nil
			}
			lastErr = fmt.Errorf("localstack health status: %s", resp.Status)
		} else {
			lastErr = fmt.Errorf("localstack health check: %w", err)
		}

		time.Sleep(1 * time.Second)
	}

	return lastErr
}

func (c *Client) Config() Config {
	return c.config
}
