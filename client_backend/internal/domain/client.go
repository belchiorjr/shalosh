package domain

import "time"

type Client struct {
	ID        string
	Name      string
	Email     string
	CreatedAt time.Time
}
