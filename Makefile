# Define the temporary file path
TEMP_MODEL_FILE=/tmp/nv_jetson_model

# Define the Docker Compose file
DOCKER_COMPOSE_FILE=docker-compose.yml

.PHONY: start stop build

build:
	@echo "Building Docker Compose services..."
	@sudo docker compose -f $(DOCKER_COMPOSE_FILE) build
	@echo "Docker Compose services built."

# Start the Docker Compose services
# /proc or /sys files aren't mountable into docker
start:
	@echo "Capturing Jetson model information..."
	@sudo cat /proc/device-tree/model > $(TEMP_MODEL_FILE)
	@echo "Jetson model information captured in $(TEMP_MODEL_FILE)."
	@echo "Starting Docker Compose services..."
	@sudo docker compose -f $(DOCKER_COMPOSE_FILE) up
	@echo "Docker Compose services started."

start-web:
	@sudo docker compose -f $(DOCKER_COMPOSE_FILE) up web

# Stop the Docker Compose services
stop:
	@echo "Stopping Docker Compose services..."
	@sudo docker compose -f $(DOCKER_COMPOSE_FILE) down
	@echo "Docker Compose services stopped."