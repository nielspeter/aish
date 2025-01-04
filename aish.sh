#!/bin/bash

# Build and start the containers detached
echo "Starting Docker containers..."
docker compose up --build -d

# Get the container ID for the 'aish' service
CONTAINER_ID=$(docker compose ps -q aish)

# Check if the container ID was retrieved
if [ -z "$CONTAINER_ID" ]; then
  echo "Error: Failed to retrieve the container ID for the 'aish' service."
  exit 1
fi

echo "Attaching to the 'aish' service container with ID: $CONTAINER_ID"

# Attach to the running 'aish' container
docker attach "$CONTAINER_ID"

# Detach from the container gracefully on exit (Ctrl+C)
echo "You can detach from the container using Ctrl+C."