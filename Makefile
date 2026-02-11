.PHONY: help up-site up-admin-backend up-client-backend up-admin-frontend up-client-frontend up-postgres up-localstack up-bd-localstack down-site git-push

COMPOSE_CMD := $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif docker-compose version >/dev/null 2>&1; then echo "docker-compose"; fi)

help:
	@echo "Targets:"
	@echo "  up-site  Build and start site container (detached)"
	@echo "  up-admin-backend  Build and start admin_backend (detached)"
	@echo "  up-client-backend  Build and start client_backend (detached)"
	@echo "  up-admin-frontend  Build and start admin_frontend (detached)"
	@echo "  up-client-frontend  Build and start client_frontend (detached)"
	@echo "  up-postgres  Start postgres (detached)"
	@echo "  up-localstack  Start localstack (detached)"
	@echo "  up-bd-localstack  Start postgres and localstack (detached)"
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

up-admin-backend: check-compose
	$(COMPOSE_CMD) up --build -d admin_backend

up-client-backend: check-compose
	$(COMPOSE_CMD) up --build -d client_backend

up-admin-frontend: check-compose
	$(COMPOSE_CMD) up --build -d admin_frontend

up-client-frontend: check-compose
	$(COMPOSE_CMD) up --build -d client_frontend

up-postgres: check-compose
	$(COMPOSE_CMD) up -d postgres

up-localstack: check-compose
	$(COMPOSE_CMD) up -d localstack

up-bd-localstack: check-compose
	$(COMPOSE_CMD) up -d postgres localstack

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
