# Use the base image
FROM ultralytics/ultralytics:latest-arm64

RUN echo "deb http://archive.raspberrypi.org/debian/ bookworm main" > /etc/apt/sources.list.d/raspi.list \
  && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 82B129927FA3303E

# Install ALSA utilities, lame for audio recording, and picamera2 for video recording
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
  alsa-utils lame ffmpeg python3-picamera2 \
  && apt-get clean \
  && apt-get autoremove \
  && rm -rf /var/cache/apt/archives/* \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

# Set the working directory inside the container
WORKDIR /app

# Specify the command to run when the container starts
CMD ["bash"]