package db

import (
	"net"
	"net/url"
	"os"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func FromEnv() Config {
	return Config{
		Host:     getenv("POSTGRES_HOST", "localhost"),
		Port:     getenv("POSTGRES_PORT", "5432"),
		User:     getenv("POSTGRES_USER", "postgres"),
		Password: getenv("POSTGRES_PASSWORD", "postgres"),
		Name:     getenv("POSTGRES_DB", "shalosh"),
		SSLMode:  getenv("POSTGRES_SSLMODE", "disable"),
	}
}

func (c Config) DSN() string {
	endpoint := net.JoinHostPort(c.Host, c.Port)
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(c.User, c.Password),
		Host:   endpoint,
		Path:   c.Name,
	}
	q := u.Query()
	q.Set("sslmode", c.SSLMode)
	u.RawQuery = q.Encode()
	return u.String()
}

func (c Config) WithDatabase(name string) Config {
	c.Name = name
	return c
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
