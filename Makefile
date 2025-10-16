# Tally Docker Container Management

.PHONY: build run stop test clean logs help

# Default target
help:
	@echo "Tally Budget App - Docker Commands"
	@echo "=================================="
	@echo "build      - Build the Docker image"
	@echo "run        - Run the container (detached)"
	@echo "stop       - Stop the running container"
	@echo "test       - Run container and test endpoints"
	@echo "logs       - Show container logs"
	@echo "shell      - Open shell in running container"
	@echo "clean      - Remove container and image"
	@echo "rebuild    - Clean and rebuild everything"
	@echo ""
	@echo "Usage: make <command>"
	@echo "Access: http://localhost:8080"
	@echo "Default password: changeme"

# Build the Docker image
build:
	@echo "Building Tally Docker image..."
	docker build -t tally-budget:latest -f docker/Dockerfile . --load

# Run the container
run:
	@echo "Starting Tally container..."
	docker run -d \
		--name tally-budget \
		-p 8080:8080 \
		-v tally-data:/data \
		--restart unless-stopped \
		tally-budget:latest
	@echo "Container started. Access at http://localhost:8080"
	@echo "Default password: changeme"

# Stop the container
stop:
	@echo "Stopping Tally container..."
	-docker stop tally-budget
	-docker rm tally-budget

# Test the container
test: stop run
	@echo "Testing Tally container..."
	@sleep 5
	@echo "Testing health endpoint..."
	@curl -f http://localhost:8080/api/health || (echo "Health check failed" && exit 1)
	@echo "Testing login endpoint..."
	@curl -f -X POST http://localhost:8080/api/auth/login \
		-H "Content-Type: application/json" \
		-d '{"password":"changeme"}' || (echo "Login test failed" && exit 1)
	@echo "All tests passed!"

# Show logs
logs:
	docker logs -f tally-budget

# Open shell in container
shell:
	docker exec -it tally-budget sh

# Clean up everything
clean: stop
	@echo "Cleaning up Tally resources..."
	-docker rmi tally-budget:latest
	-docker volume rm tally-data

# Rebuild everything
rebuild: clean build

# Development mode (run with live reload)
dev-run: stop
	@echo "Starting Tally in development mode..."
	docker run -d \
		--name tally-budget \
		-p 8080:8080 \
		-v $(PWD)/data:/data \
		-v $(PWD)/frontend/dist:/usr/share/nginx/html \
		tally-budget:latest

# Quick status check
status:
	@echo "Tally Container Status:"
	@docker ps -f name=tally-budget --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"