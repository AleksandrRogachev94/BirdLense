# Use the base image
FROM ultralytics/ultralytics:latest-arm64

# Install ALSA utilities and lame for audio recording
RUN apt-get update && apt-get install -y \
  alsa-utils lame \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Specify the command to run when the container starts
CMD ["bash"]