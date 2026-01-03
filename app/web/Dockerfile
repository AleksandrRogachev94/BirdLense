# Use a minimal Python image
FROM python:3.11-alpine

# Set the working directory
WORKDIR /app

# dependencies needed to build psutil
RUN apk add --no-cache gcc python3-dev musl-dev linux-headers

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

EXPOSE 8080

# Run app.py when the container launches
CMD ["gunicorn", "-b", "0.0.0.0:8000", "-", "app:app"]