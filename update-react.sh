#!/bin/bash

# Stop the React frontend container
echo "Stopping existing container..."
sudo docker stop react-frontend

# Remove the existing React frontend container
echo "Removing existing container..."
sudo docker rm react-frontend

# Clean the existing build directory
echo "Cleaning the build directory..."
rm -rf ./build

# Build the React app
echo "Building the React app..."
npm run build

# Ensure the build directory has proper permissions
echo "Setting permissions for the build directory..."
sudo chmod -R 755 /volume1/ExpensesDB/build

# Start a new React frontend container with the updated code
echo "Starting a new container with updated code..."
sudo docker run -d \
    -p 3000:80 \
    --name react-frontend \
    -v /volume1/ExpensesDB/build:/usr/share/nginx/html \
    -v /volume1/ExpensesDB/nginx/default.conf:/etc/nginx/conf.d/default.conf \
    my-react-app

echo "Update complete. Your changes should now be live at http://10.100.10.58:3000"

