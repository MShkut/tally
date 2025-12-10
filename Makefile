# Tally Budget - Docker Deployment Makefile

.PHONY: help prod-up prod-down prod-pull prod-logs dev-up dev-down dev-pull dev-logs login build push clean

# Default target
help:
	@echo "Tally Budget - Docker Deployment Commands"
	@echo "=========================================="
	@echo ""
	@echo "Production Commands:"
	@echo "  prod-pull    - Pull latest production image from GitHub Container Registry"
	@echo "  prod-up      - Start production container"
	@echo "  prod-down    - Stop production container"
	@echo "  prod-restart - Pull latest and restart production"
	@echo "  prod-logs    - Show production container logs"
	@echo ""
	@echo "Development Commands:"
	@echo "  dev-pull     - Pull latest development image from GitHub Container Registry"
	@echo "  dev-up       - Start development container"
	@echo "  dev-down     - Stop development container"
	@echo "  dev-restart  - Pull latest and restart development"
	@echo "  dev-logs     - Show development container logs"
	@echo ""
	@echo "Local Build Commands:"
	@echo "  build        - Build Docker image locally"
	@echo "  push         - Push local image to GitHub Container Registry"
	@echo ""
	@echo "Utility Commands:"
	@echo "  login        - Login to GitHub Container Registry"
	@echo "  status       - Show status of all Tally containers"
	@echo "  clean        - Remove containers and volumes (DESTRUCTIVE)"
	@echo ""
	@echo "Access:"
	@echo "  Production:  http://localhost:8085"
	@echo "  Development: http://localhost:8086"

# Production commands
prod-pull:
	@echo "Pulling latest production image..."
	docker compose pull

prod-up:
	@echo "Starting production container..."
	docker compose up -d
	@echo "Production running at http://localhost:8085"

prod-down:
	@echo "Stopping production container..."
	docker compose down

prod-restart: prod-pull prod-down prod-up
	@echo "Production restarted with latest image"

prod-logs:
	docker compose logs -f

# Development commands
dev-pull:
	@echo "Pulling latest development image..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml pull

dev-up:
	@echo "Starting development container..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "Development running at http://localhost:8086"

dev-down:
	@echo "Stopping development container..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

dev-restart: dev-pull dev-down dev-up
	@echo "Development restarted with latest image"

dev-logs:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Local build commands
build:
	@echo "Building Docker image locally..."
	docker build -t ghcr.io/mshkut/tally:local -f docker/Dockerfile .
	@echo "Image built: ghcr.io/carb-frog/tally:local"

push:
	@echo "Pushing image to GitHub Container Registry..."
	@echo "Make sure you've run 'make login' first"
	docker push ghcr.io/carb-frog/tally:latest

# Utility commands
login:
	@echo "Logging into GitHub Container Registry..."
	@echo "Username: your GitHub username"
	@echo "Password: GitHub Personal Access Token (PAT) with 'read:packages' scope"
	docker login ghcr.io

status:
	@echo "Tally Container Status:"
	@docker ps -a -f name=tally-budget --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

clean:
	@echo "WARNING: This will remove all Tally containers and volumes!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@echo "Stopping and removing containers..."
	-docker compose down -v
	-docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	@echo "Cleanup complete"
