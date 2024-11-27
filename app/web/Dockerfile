# Use a minimal Python image
FROM python:3.9-alpine

# Set the working directory
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

EXPOSE 8080

# Run app.py when the container launches
CMD ["gunicorn", "-b", "0.0.0.0:8000", "-", "app:app"]