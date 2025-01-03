#!/bin/bash

# Variables
REACT_APP_PATH="/volume1/ExpensesDB"
BUILD_PATH="$REACT_APP_PATH/build"
NGINX_CONFIG_PATH="$REACT_APP_PATH/nginx/default.conf"
CONTAINER_NAME="react-frontend"
DOCKER_IMAGE="my-react-app"
PORT=3000

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if npm and docker are available
if ! command -v npm &> /dev/null; then
    log "Error: npm is not installed or not in PATH."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log "Error: Docker is not installed or not in PATH."
    exit 1
fi

# Stop the React frontend container
log "Stopping existing container..."
if sudo docker stop "$CONTAINER_NAME" &> /dev/null; then
    log "Successfully stopped container: $CONTAINER_NAME"
else
    log "No running container named $CONTAINER_NAME found. Skipping stop step."
fi

# Remove the existing React frontend container
log "Removing existing container..."
if sudo docker rm "$CONTAINER_NAME" &> /dev/null; then
    log "Successfully removed container: $CONTAINER_NAME"
else
    log "No container named $CONTAINER_NAME found. Skipping remove step."
fi

# Clean the existing build directory
log "Cleaning the build directory..."
if rm -rf "$BUILD_PATH"; then
    log "Build directory cleaned: $BUILD_PATH"
else
    log "Failed to clean build directory: $BUILD_PATH"
    exit 1
fi

# Build the React app
log "Building the React app..."
if npm run build; then
    log "React app built successfully."
else
    log "Error building React app. Exiting."
    exit 1
fi

# Ensure the build directory has proper permissions
log "Setting permissions for the build directory..."
if sudo chmod -R 755 "$BUILD_PATH" && sudo chmod -R 755 "$REACT_APP_PATH/nginx"; then
    log "Permissions set for $BUILD_PATH and $REACT_APP_PATH/nginx"
else
    log "Failed to set permissions. Exiting."
    exit 1
fi

# Start a new React frontend container with the updated code
log "Starting a new container with updated code..."
if sudo docker run -d \
    -p "$PORT:80" \
    --name "$CONTAINER_NAME" \
    -v "$BUILD_PATH:/usr/share/nginx/html" \
    -v "$NGINX_CONFIG_PATH:/etc/nginx/conf.d/default.conf" \
    "$DOCKER_IMAGE"; then
    log "Container started successfully. Your changes should now be live at http://10.100.10.58:$PORT"
else
    log "Failed to start the container. Exiting."
    exit 1
fi

log "Update process complete."

