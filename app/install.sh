#!/bin/bash

# Exit on error
set -e

echo "Starting Smart Bird Feeder installation..."

# Update package lists
sudo apt-get update

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo pip3 install docker-compose

# Install PulseAudio
echo "Installing PulseAudio..."
sudo apt-get install -y pulseaudio

# Enable PulseAudio service
systemctl --user enable pulseaudio
systemctl --user start pulseaudio

# Enable camera interface
echo "Enabling camera interface..."
sudo raspi-config nonint do_camera 0

echo "Installation completed!"
echo "Please log out and log back in for group changes to take effect."
echo "To start the application, run: make start"