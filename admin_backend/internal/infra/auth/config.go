package auth

import (
	"os"
	"time"
)

type Config struct {
	Secret    string
	Issuer    string
	ExpiresIn time.Duration
}

func FromEnv() Config {
	expiresIn := 24 * time.Hour
	if raw := getenv("JWT_EXPIRES_IN", "24h"); raw != "" {
		if parsed, err := time.ParseDuration(raw); err == nil {
			expiresIn = parsed
		}
	}

	return Config{
		Secret:    getenv("JWT_SECRET", "change-me"),
		Issuer:    getenv("JWT_ISSUER", "shalosh"),
		ExpiresIn: expiresIn,
	}
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
