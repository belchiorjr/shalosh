.PHONY: help up-site down-site git-push

help:
	@echo "Targets:"
	@echo "  up-site  Build and start site container (detached)"
	@echo "  down-site  Stop and remove containers"
	@echo "  git-push  Add/commit/push with message \"DESC - <date>\""

up-site:
	docker compose up --build -d site

down-site:
	docker compose down

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
