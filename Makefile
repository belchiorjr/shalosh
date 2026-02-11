.PHONY: help up-site down-site git-push

COMPOSE_CMD := $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif docker-compose version >/dev/null 2>&1; then echo "docker-compose"; fi)

help:
	@echo "Targets:"
	@echo "  up-site  Build and start site container (detached)"
	@echo "  down-site  Stop and remove containers"
	@echo "  git-push  Add/commit/push with message \"DESC - <date>\""

check-compose:
	@if [ -z "$(COMPOSE_CMD)" ]; then \
		echo "Docker Compose not found."; \
		echo "Install with: sudo apt-get update && sudo apt-get install -y docker-compose-plugin"; \
		exit 1; \
	fi

up-site: check-compose
	$(COMPOSE_CMD) up --build -d site

down-site: check-compose
	$(COMPOSE_CMD) down

git-push:
	@if [ -z "$(DESC)" ]; then \
		echo "Uso: make git-push DESC=\"breve descricao\""; \
		exit 1; \
	fi
	@if git diff --quiet && git diff --cached --quiet; then \
		echo "Nenhuma alteracao para commitar."; \
		exit 1; \
	fi
	git add .
	git commit -m "$(DESC) - $$(date +%Y-%m-%d)"
	git push
