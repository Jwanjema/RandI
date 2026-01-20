# Backend Dockerfile for Django application
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project files
COPY . .

# Create staticfiles directory
RUN mkdir -p staticfiles media

# Collect static files (skip if it fails - migrations not run yet)
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Create a startup script file
RUN cat > /start.sh << 'EOF'
#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

if [ "${CREATE_DEMO_USERS}" = "true" ]; then
  echo "Creating demo users..."
  python manage.py create_users || true
fi

echo "Starting gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 rental_system.wsgi:application
EOF

RUN chmod +x /start.sh

# Run startup script
CMD ["/start.sh"]
