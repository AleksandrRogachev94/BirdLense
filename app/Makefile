.PHONY: build-dev start-dev stop-dev build start stop

# DEV
build-dev:
	@echo "Building Docker Compose images..."
	@sudo docker compose -f docker-compose.base.yml -f docker-compose.dev.yml build
	@echo "Build finished."

start-dev:
	@echo "Starting Docker Compose services..."
	@sudo docker compose -f docker-compose.base.yml -f docker-compose.dev.yml up
	@echo "Docker Compose services started."

stop-dev:
	@echo "Stopping Docker Compose services..."
	@sudo docker compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "Docker Compose services stopped."

# PROD
build:
	@echo "Building Docker Compose services..."
	@sudo docker compose -f docker-compose.base.yml -f docker-compose.prod.yml build
	@echo "Build finished."

start:
	@echo "Starting Docker Compose services..."
	@sudo docker compose -f docker-compose.base.yml -f docker-compose.prod.yml up -d
	@echo "Docker Compose services started."

logs:
	@sudo docker compose -f docker-compose.base.yml -f docker-compose.prod.yml logs -f

stop:
	@echo "Stopping Docker Compose services..."
	@sudo docker compose -f docker-compose.base.yml -f docker-compose.prod.yml down
	@echo "Docker Compose services stopped."