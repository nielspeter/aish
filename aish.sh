#!/bin/bash

# Build and start the container detached
docker compose up --build -d

# Get the container ID
CONTAINER_ID=$(docker compose ps -q)

# Attach to the running container
docker attach $CONTAINER_ID