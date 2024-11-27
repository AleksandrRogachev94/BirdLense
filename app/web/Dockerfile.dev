# Use a minimal Python image
FROM python:3.9-alpine

# Set the working directory
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# Expose the Flask port
EXPOSE 8080

# Define environment variable
ENV FLASK_APP=app.py

# Run app.py when the container launches
CMD ["flask", "run", "--host=0.0.0.0", "--port=8000"]