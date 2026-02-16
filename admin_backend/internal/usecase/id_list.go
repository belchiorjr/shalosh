package usecase

import "strings"

func uniqueTrimmedIDs(values []string) []string {
	seen := make(map[string]struct{})
	normalized := make([]string, 0, len(values))

	for _, value := range values {
		id := strings.TrimSpace(value)
		if id == "" {
			continue
		}
		if _, alreadyAdded := seen[id]; alreadyAdded {
			continue
		}

		seen[id] = struct{}{}
		normalized = append(normalized, id)
	}

	return normalized
}
