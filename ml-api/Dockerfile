# Use an official Python runtime as a parent image
FROM python:3.10.3-slim-buster

# Set the working directory in the container
WORKDIR /workspace

# Copy the requirements file into the container
COPY requirements.txt requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV HOST 0.0.0.0

# Expose the port FastAPI will run on
EXPOSE 8080

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
