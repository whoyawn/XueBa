# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY src ./src

# Expose the port FastAPI will run on
EXPOSE 3000

# Command to run the server
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "${PORT}"] 