package db

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

func EnsureDatabase(ctx context.Context, cfg Config) error {
	adminDB := getenv("POSTGRES_ADMIN_DB", "postgres")
	adminCfg := cfg.WithDatabase(adminDB)

	var db *sqlx.DB
	var err error
	var lastErr error

	for attempt := 0; attempt < 10; attempt++ {
		db, err = sqlx.Open("postgres", adminCfg.DSN())
		if err == nil {
			pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
			lastErr = db.PingContext(pingCtx)
			cancel()
			if lastErr == nil {
				break
			}
			_ = db.Close()
		}
		if err != nil {
			lastErr = err
		}
		time.Sleep(1 * time.Second)
	}

	if lastErr != nil {
		return fmt.Errorf("connect admin database: %w", lastErr)
	}
	defer db.Close()

	var exists bool
	if err := db.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1)",
		cfg.Name,
	); err != nil {
		return fmt.Errorf("check database exists: %w", err)
	}

	if exists {
		return nil
	}

	_, err = db.ExecContext(ctx, "CREATE DATABASE "+pq.QuoteIdentifier(cfg.Name))
	if err != nil {
		var pgErr *pq.Error
		if errors.As(err, &pgErr) && pgErr.Code == "42P04" {
			return nil
		}
		return fmt.Errorf("create database %s: %w", cfg.Name, err)
	}

	return nil
}
