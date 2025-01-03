#!/bin/bash

# Stop the backend container
echo "Stopping the existing backend container..."
sudo docker stop backend-container

# Remove the backend container
echo "Removing the existing backend container..."
sudo docker rm backend-container

# Build the updated backend image
echo "Building the updated backend image..."
sudo docker build -t backend-app .

# Ensure the custom network exists
sudo docker network inspect app-network >/dev/null 2>&1 || \
    sudo docker network create app-network

# Start the new backend container
echo "Starting the new backend container..."
sudo docker run -d \
    -p 5002:5002 \
    --name backend-container \
    --env-file /volume1/ExpensesDB/backend/.env \
    --network expenses-network \
    backend-app

# Show logs to verify that the backend is running
echo "Showing backend logs..."
sudo docker logs -f backend-container
