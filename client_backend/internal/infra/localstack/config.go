package localstack

import "os"

type Config struct {
	Endpoint        string
	Region          string
	AccessKeyID     string
	SecretAccessKey string
}

func FromEnv() Config {
	return Config{
		Endpoint:        getenv("LOCALSTACK_ENDPOINT", "http://localhost:4566"),
		Region:          getenv("LOCALSTACK_REGION", "us-east-1"),
		AccessKeyID:     getenv("AWS_ACCESS_KEY_ID", "test"),
		SecretAccessKey: getenv("AWS_SECRET_ACCESS_KEY", "test"),
	}
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
