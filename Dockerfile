FROM python:3.11-slim

# Install system dependencies required by rasterio / GDAL and related libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    libexpat1 \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory inside the container
WORKDIR /app

# Copy dependency file first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code (including backend/data/carlin_s2.tif)
COPY . .

# Verify satellite data file was copied successfully
RUN ls -lh /app/backend/data/carlin_s2.tif || echo "WARNING: Satellite data file not found!"

# Expose the port uvicorn will listen on
EXPOSE 8000

# Start the FastAPI app with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]