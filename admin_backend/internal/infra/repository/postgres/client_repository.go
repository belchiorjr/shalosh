package postgres

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"admin_backend/internal/usecase"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type ClientRepository struct {
	db *sqlx.DB
}

func NewClientRepository(db *sqlx.DB) *ClientRepository {
	return &ClientRepository{
		db: db,
	}
}

type clientListRecord struct {
	ID             string    `db:"id"`
	Name           string    `db:"name"`
	Email          string    `db:"email"`
	Login          string    `db:"login"`
	Avatar         string    `db:"avatar"`
	Phone          string    `db:"phone"`
	Address        string    `db:"address"`
	Active         bool      `db:"active"`
	AddressesCount int       `db:"addresses_count"`
	PhonesCount    int       `db:"phones_count"`
	Created        time.Time `db:"created"`
	Updated        time.Time `db:"updated"`
}

type clientRecord struct {
	ID      string    `db:"id"`
	Name    string    `db:"name"`
	Email   string    `db:"email"`
	Login   string    `db:"login"`
	Avatar  string    `db:"avatar"`
	Active  bool      `db:"active"`
	Created time.Time `db:"created"`
	Updated time.Time `db:"updated"`
}

type clientAddressRecord struct {
	ID           string    `db:"id"`
	ClientID     string    `db:"client_id"`
	Label        string    `db:"label"`
	Country      string    `db:"country"`
	ZipCode      string    `db:"zipcode"`
	StreetType   string    `db:"street_type"`
	StreetName   string    `db:"street_name"`
	Street       string    `db:"street"`
	Number       string    `db:"number"`
	Neighborhood string    `db:"neighborhood"`
	City         string    `db:"city"`
	State        string    `db:"state"`
	Complement   string    `db:"complement"`
	Latitude     *float64  `db:"latitude"`
	Longitude    *float64  `db:"longitude"`
	Position     int       `db:"position"`
	Active       bool      `db:"active"`
	Created      time.Time `db:"created"`
	Updated      time.Time `db:"updated"`
}

type clientPhoneRecord struct {
	ID          string    `db:"id"`
	ClientID    string    `db:"client_id"`
	Label       string    `db:"label"`
	PhoneNumber string    `db:"phone_number"`
	IsWhatsapp  bool      `db:"is_whatsapp"`
	Position    int       `db:"position"`
	Active      bool      `db:"active"`
	Created     time.Time `db:"created"`
	Updated     time.Time `db:"updated"`
}

func (r *ClientRepository) List(ctx context.Context, onlyActive bool) ([]usecase.ClientListItem, error) {
	query := `
		SELECT
		  client.id,
		  client.name,
		  client.email,
		  client.login,
		  COALESCE(client.avatar, '') AS avatar,
		  COALESCE((
		    SELECT phone.phone_number
		    FROM client_phones phone
		    WHERE phone.client_id = client.id
		      AND phone.active = TRUE
		    ORDER BY phone.position, phone.created
		    LIMIT 1
		  ), '') AS phone,
		  COALESCE((
		    SELECT CONCAT_WS(', ',
		      NULLIF(TRIM(CONCAT_WS(' ', address.street, address.number)), ''),
		      NULLIF(address.neighborhood, ''),
		      NULLIF(TRIM(CONCAT_WS(' - ', address.city, address.state)), '')
		    )
		    FROM client_addresses address
		    WHERE address.client_id = client.id
		      AND address.active = TRUE
		    ORDER BY address.position, address.created
		    LIMIT 1
		  ), '') AS address,
		  (SELECT COUNT(*)::int FROM client_addresses address WHERE address.client_id = client.id AND address.active = TRUE) AS addresses_count,
		  (SELECT COUNT(*)::int FROM client_phones phone WHERE phone.client_id = client.id AND phone.active = TRUE) AS phones_count,
		  client.active,
		  client.created,
		  client.updated
		FROM clients client
	`

	if onlyActive {
		query += " WHERE client.active = TRUE"
	}

	query += " ORDER BY client.created DESC, client.id DESC"

	var records []clientListRecord
	if err := r.db.SelectContext(ctx, &records, query); err != nil {
		return nil, err
	}

	clients := make([]usecase.ClientListItem, 0, len(records))
	for _, record := range records {
		clients = append(clients, usecase.ClientListItem{
			ID:             record.ID,
			Name:           record.Name,
			Email:          record.Email,
			Login:          record.Login,
			Avatar:         record.Avatar,
			Phone:          record.Phone,
			Address:        record.Address,
			Active:         record.Active,
			AddressesCount: record.AddressesCount,
			PhonesCount:    record.PhonesCount,
			Created:        record.Created,
			Updated:        record.Updated,
		})
	}

	return clients, nil
}

func (r *ClientRepository) GetDetail(ctx context.Context, clientID string) (usecase.ClientDetail, error) {
	var client clientRecord
	if err := r.db.GetContext(
		ctx,
		&client,
		`
		SELECT id, name, email, login, COALESCE(avatar, '') AS avatar, active, created, updated
		FROM clients
		WHERE id = $1
		LIMIT 1
		`,
		clientID,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return usecase.ClientDetail{}, usecase.ErrNotFound
		}
		return usecase.ClientDetail{}, err
	}

	var addressRecords []clientAddressRecord
	if err := r.db.SelectContext(
		ctx,
		&addressRecords,
		`
			SELECT
			  id,
			  client_id,
			  label,
			  country,
			  zipcode,
			  street_type,
			  street_name,
			  street,
			  number,
			  neighborhood,
		  city,
		  state,
		  complement,
		  latitude,
		  longitude,
		  position,
		  active,
		  created,
		  updated
		FROM client_addresses
		WHERE client_id = $1
		ORDER BY position ASC, created ASC, id ASC
		`,
		clientID,
	); err != nil {
		return usecase.ClientDetail{}, err
	}

	var phoneRecords []clientPhoneRecord
	if err := r.db.SelectContext(
		ctx,
		&phoneRecords,
		`
		SELECT
		  id,
		  client_id,
		  label,
		  phone_number,
		  is_whatsapp,
		  position,
		  active,
		  created,
		  updated
		FROM client_phones
		WHERE client_id = $1
		ORDER BY position ASC, created ASC, id ASC
		`,
		clientID,
	); err != nil {
		return usecase.ClientDetail{}, err
	}

	addresses := make([]usecase.ClientAddress, 0, len(addressRecords))
	for _, address := range addressRecords {
		addresses = append(addresses, usecase.ClientAddress{
			ID:           address.ID,
			ClientID:     address.ClientID,
			Label:        address.Label,
			Country:      address.Country,
			ZipCode:      address.ZipCode,
			StreetType:   address.StreetType,
			StreetName:   address.StreetName,
			Street:       address.Street,
			Number:       address.Number,
			Neighborhood: address.Neighborhood,
			City:         address.City,
			State:        address.State,
			Complement:   address.Complement,
			Latitude:     address.Latitude,
			Longitude:    address.Longitude,
			Position:     address.Position,
			Active:       address.Active,
			Created:      address.Created,
			Updated:      address.Updated,
		})
	}

	phones := make([]usecase.ClientPhone, 0, len(phoneRecords))
	for _, phone := range phoneRecords {
		phones = append(phones, usecase.ClientPhone{
			ID:          phone.ID,
			ClientID:    phone.ClientID,
			Label:       phone.Label,
			PhoneNumber: phone.PhoneNumber,
			IsWhatsapp:  phone.IsWhatsapp,
			Position:    phone.Position,
			Active:      phone.Active,
			Created:     phone.Created,
			Updated:     phone.Updated,
		})
	}

	return usecase.ClientDetail{
		ID:        client.ID,
		Name:      client.Name,
		Email:     client.Email,
		Login:     client.Login,
		Avatar:    client.Avatar,
		Active:    client.Active,
		Created:   client.Created,
		Updated:   client.Updated,
		Addresses: addresses,
		Phones:    phones,
	}, nil
}

func (r *ClientRepository) Create(ctx context.Context, input usecase.CreateClientInput) (usecase.ClientDetail, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ClientDetail{}, err
	}
	defer tx.Rollback()

	var clientID string
	if err := tx.GetContext(
		ctx,
		&clientID,
		`
		INSERT INTO clients (name, email, login, password, avatar, active, created, updated)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, NOW(), NOW())
		RETURNING id
		`,
		input.Name,
		input.Email,
		input.Login,
		input.Password,
		input.Avatar,
		input.Active,
	); err != nil {
		return usecase.ClientDetail{}, mapClientPersistenceError(err)
	}

	if err := r.replaceClientAddresses(ctx, tx, clientID, input.Addresses); err != nil {
		return usecase.ClientDetail{}, err
	}
	if err := r.replaceClientPhones(ctx, tx, clientID, input.Phones); err != nil {
		return usecase.ClientDetail{}, err
	}

	if err := tx.Commit(); err != nil {
		return usecase.ClientDetail{}, err
	}

	return r.GetDetail(ctx, clientID)
}

func (r *ClientRepository) Update(ctx context.Context, input usecase.UpdateClientInput) (usecase.ClientDetail, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return usecase.ClientDetail{}, err
	}
	defer tx.Rollback()

	var exists bool
	if err := tx.GetContext(
		ctx,
		&exists,
		"SELECT EXISTS (SELECT 1 FROM clients WHERE id = $1)",
		input.ID,
	); err != nil {
		return usecase.ClientDetail{}, err
	}
	if !exists {
		return usecase.ClientDetail{}, usecase.ErrNotFound
	}

	if _, err := tx.ExecContext(
		ctx,
		`
		UPDATE clients
		SET name = $1,
		    email = $2,
		    login = $3,
		    password = COALESCE(NULLIF($4, ''), password),
		    avatar = NULLIF($5, ''),
		    active = COALESCE($6::boolean, active),
		    updated = NOW()
		WHERE id = $7
		`,
		input.Name,
		input.Email,
		input.Login,
		input.Password,
		input.Avatar,
		input.Active,
		input.ID,
	); err != nil {
		return usecase.ClientDetail{}, mapClientPersistenceError(err)
	}

	if input.Addresses != nil {
		if err := r.replaceClientAddresses(ctx, tx, input.ID, *input.Addresses); err != nil {
			return usecase.ClientDetail{}, err
		}
	}

	if input.Phones != nil {
		if err := r.replaceClientPhones(ctx, tx, input.ID, *input.Phones); err != nil {
			return usecase.ClientDetail{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return usecase.ClientDetail{}, err
	}

	return r.GetDetail(ctx, input.ID)
}

func (r *ClientRepository) Deactivate(ctx context.Context, clientID string) (usecase.ClientDetail, error) {
	result, err := r.db.ExecContext(
		ctx,
		`
		UPDATE clients
		SET active = FALSE,
		    updated = NOW()
		WHERE id = $1
		`,
		clientID,
	)
	if err != nil {
		return usecase.ClientDetail{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return usecase.ClientDetail{}, err
	}
	if rowsAffected == 0 {
		return usecase.ClientDetail{}, usecase.ErrNotFound
	}

	return r.GetDetail(ctx, clientID)
}

func (r *ClientRepository) replaceClientAddresses(
	ctx context.Context,
	tx *sqlx.Tx,
	clientID string,
	addresses []usecase.ClientAddressInput,
) error {
	if _, err := tx.ExecContext(ctx, "DELETE FROM client_addresses WHERE client_id = $1", clientID); err != nil {
		return err
	}

	for index, address := range addresses {
		position := index
		if address.Position != nil {
			position = *address.Position
		}
		active := true
		if address.Active != nil {
			active = *address.Active
		}

		if address.ZipCode == "" &&
			address.Street == "" &&
			address.Neighborhood == "" &&
			address.City == "" &&
			address.State == "" {
			continue
		}
		if address.ZipCode != "" && len(address.ZipCode) != 8 {
			return usecase.ErrInvalidInput
		}

		if _, err := tx.ExecContext(
			ctx,
			`
				INSERT INTO client_addresses (
				  client_id,
				  label,
				  country,
				  zipcode,
				  street_type,
				  street_name,
				  street,
				  number,
				  neighborhood,
			  city,
			  state,
			  complement,
			  latitude,
			  longitude,
			  position,
			  active,
				  created,
				  updated
				)
					VALUES (
					  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
					)
					`,
			clientID,
			address.Label,
			address.Country,
			address.ZipCode,
			address.StreetType,
			address.StreetName,
			address.Street,
			address.Number,
			address.Neighborhood,
			address.City,
			address.State,
			address.Complement,
			address.Latitude,
			address.Longitude,
			position,
			active,
		); err != nil {
			return err
		}
	}

	return nil
}

func (r *ClientRepository) replaceClientPhones(
	ctx context.Context,
	tx *sqlx.Tx,
	clientID string,
	phones []usecase.ClientPhoneInput,
) error {
	if _, err := tx.ExecContext(ctx, "DELETE FROM client_phones WHERE client_id = $1", clientID); err != nil {
		return err
	}

	for index, phone := range phones {
		if strings.TrimSpace(phone.PhoneNumber) == "" {
			continue
		}

		position := index
		if phone.Position != nil {
			position = *phone.Position
		}
		active := true
		if phone.Active != nil {
			active = *phone.Active
		}
		isWhatsapp := false
		if phone.IsWhatsapp != nil {
			isWhatsapp = *phone.IsWhatsapp
		}

		if _, err := tx.ExecContext(
			ctx,
			`
				INSERT INTO client_phones (
				  client_id,
				  label,
				  phone_number,
				  is_whatsapp,
			  position,
			  active,
				  created,
				  updated
				)
				VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
				`,
			clientID,
			phone.Label,
			phone.PhoneNumber,
			isWhatsapp,
			position,
			active,
		); err != nil {
			return err
		}
	}

	return nil
}

func mapClientPersistenceError(err error) error {
	var pgErr *pq.Error
	if errors.As(err, &pgErr) {
		switch pgErr.Constraint {
		case "clients_login_lower_key":
			return usecase.ErrClientLoginInUse
		case "clients_email_lower_key":
			return usecase.ErrClientEmailInUse
		}
	}

	return err
}
