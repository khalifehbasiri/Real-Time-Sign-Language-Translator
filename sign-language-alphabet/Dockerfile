FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt /app

# Install required system libraries
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . /app

# Expose the port Flask will run on
EXPOSE 5000

# Run the Flask app
CMD ["python", "app.py"]
