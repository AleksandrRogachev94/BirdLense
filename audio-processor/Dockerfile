# Use the base image
FROM python:3.9-slim

RUN apt-get update
RUN apt-get install -y ffmpeg

COPY requirements.txt .
RUN pip install -r requirements.txt

# Set the working directory inside the container
WORKDIR /app

# Specify the command to run when the container starts
CMD ["bash"]