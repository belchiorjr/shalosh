package clients

import "admin_backend/internal/usecase"

func mapAddressPayloads(addresses []addressPayload) []usecase.ClientAddressInput {
	mapped := make([]usecase.ClientAddressInput, 0, len(addresses))
	for _, address := range addresses {
		mapped = append(mapped, usecase.ClientAddressInput{
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
		})
	}
	return mapped
}

func mapPhonePayloads(phones []phonePayload) []usecase.ClientPhoneInput {
	mapped := make([]usecase.ClientPhoneInput, 0, len(phones))
	for _, phone := range phones {
		mapped = append(mapped, usecase.ClientPhoneInput{
			Label:       phone.Label,
			PhoneNumber: phone.PhoneNumber,
			IsWhatsapp:  phone.IsWhatsapp,
			Position:    phone.Position,
			Active:      phone.Active,
		})
	}
	return mapped
}
