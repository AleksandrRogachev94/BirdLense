# Define the temporary file path
TEMP_MODEL_FILE=/tmp/nv_jetson_model

# Define the Docker Compose file
DOCKER_COMPOSE_DEV=docker-compose.yml
DOCKER_COMPOSE_PROD=docker-compose.prod.yml

.PHONY: start stop build

start-dev:
	@echo "Capturing Jetson model information..."
	@sudo cat /proc/device-tree/model > $(TEMP_MODEL_FILE)
	@echo "Jetson model information captured in $(TEMP_MODEL_FILE)."
	@echo "Starting Docker Compose services..."
	@sudo docker compose -f $(DOCKER_COMPOSE_DEV) up
	@echo "Docker Compose services started."

start-dev-web:
	@sudo docker compose -f $(DOCKER_COMPOSE_DEV) up nginx web ui ntfy --build

stop-dev:
	@echo "Stopping Docker Compose services..."
	@sudo docker compose -f $(DOCKER_COMPOSE_DEV) down
	@echo "Docker Compose services stopped."

start:
	@echo "Capturing Jetson model information..."
	@sudo cat /proc/device-tree/model > $(TEMP_MODEL_FILE)
	@echo "Jetson model information captured in $(TEMP_MODEL_FILE)."
	@echo "Starting Docker Compose services..."
	@sudo docker compose -f $(DOCKER_COMPOSE_PROD) up -d
	@echo "Docker Compose services started."

start-web:
	@sudo docker compose -f $(DOCKER_COMPOSE_PROD) up nginx web ui ntfy --build

stop:
	@echo "Stopping Docker Compose services..."
	@sudo docker compose -f $(DOCKER_COMPOSE_PROD) down
	@echo "Docker Compose services stopped."