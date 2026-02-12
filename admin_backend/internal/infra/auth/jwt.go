package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type TokenManager struct {
	secret    []byte
	issuer    string
	expiresIn time.Duration
}

type Claims struct {
	Issuer string `json:"iss"`
	Sub    string `json:"sub"`
	Login  string `json:"login"`
	Name   string `json:"name"`
	Iat    int64  `json:"iat"`
	Exp    int64  `json:"exp"`
}

func NewTokenManager(cfg Config) *TokenManager {
	secret := strings.TrimSpace(cfg.Secret)
	if secret == "" {
		secret = "change-me"
	}

	expiresIn := cfg.ExpiresIn
	if expiresIn <= 0 {
		expiresIn = 24 * time.Hour
	}

	return &TokenManager{
		secret:    []byte(secret),
		issuer:    cfg.Issuer,
		expiresIn: expiresIn,
	}
}

func (m *TokenManager) Generate(userID, login, name string, now time.Time) (string, time.Time, error) {
	type header struct {
		Alg string `json:"alg"`
		Typ string `json:"typ"`
	}

	now = now.UTC()
	expiresAt := now.Add(m.expiresIn)

	headerJSON, err := json.Marshal(header{
		Alg: "HS256",
		Typ: "JWT",
	})
	if err != nil {
		return "", time.Time{}, fmt.Errorf("marshal jwt header: %w", err)
	}

	claimsJSON, err := json.Marshal(Claims{
		Issuer: m.issuer,
		Sub:    userID,
		Login:  login,
		Name:   name,
		Iat:    now.Unix(),
		Exp:    expiresAt.Unix(),
	})
	if err != nil {
		return "", time.Time{}, fmt.Errorf("marshal jwt claims: %w", err)
	}

	encodedHeader := base64.RawURLEncoding.EncodeToString(headerJSON)
	encodedClaims := base64.RawURLEncoding.EncodeToString(claimsJSON)
	unsignedToken := encodedHeader + "." + encodedClaims

	hash := hmac.New(sha256.New, m.secret)
	if _, err := hash.Write([]byte(unsignedToken)); err != nil {
		return "", time.Time{}, fmt.Errorf("sign jwt: %w", err)
	}

	signature := base64.RawURLEncoding.EncodeToString(hash.Sum(nil))
	return unsignedToken + "." + signature, expiresAt, nil
}

func (m *TokenManager) ParseAndValidate(token string, now time.Time) (Claims, error) {
	token = strings.TrimSpace(token)
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return Claims{}, fmt.Errorf("invalid jwt token format")
	}

	unsignedToken := parts[0] + "." + parts[1]

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return Claims{}, fmt.Errorf("decode jwt signature: %w", err)
	}

	hash := hmac.New(sha256.New, m.secret)
	if _, err := hash.Write([]byte(unsignedToken)); err != nil {
		return Claims{}, fmt.Errorf("hash jwt token: %w", err)
	}

	if !hmac.Equal(signature, hash.Sum(nil)) {
		return Claims{}, fmt.Errorf("invalid jwt signature")
	}

	claimsBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return Claims{}, fmt.Errorf("decode jwt claims: %w", err)
	}

	var claims Claims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return Claims{}, fmt.Errorf("unmarshal jwt claims: %w", err)
	}

	now = now.UTC()
	if claims.Issuer != m.issuer {
		return Claims{}, fmt.Errorf("invalid jwt issuer")
	}
	if claims.Exp <= 0 || now.Unix() >= claims.Exp {
		return Claims{}, fmt.Errorf("jwt token expired")
	}
	if strings.TrimSpace(claims.Sub) == "" {
		return Claims{}, fmt.Errorf("invalid jwt subject")
	}

	return claims, nil
}
