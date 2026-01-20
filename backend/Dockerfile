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

# Create startup script
RUN echo '#!/bin/bash\n\
    set -e\n\
    echo "Running migrations..."\n\
    python manage.py migrate --noinput\n\
    \n\
    if [ "${CREATE_DEMO_USERS}" = "true" ]; then\n\
    echo "Creating demo users..."\n\
    python manage.py create_users || true\n\
    fi\n\
    \n\
    echo "Starting gunicorn..."\n\
    exec gunicorn --bind 0.0.0.0:8000 --workers 4 rental_system.wsgi:application\n\
    ' > /start.sh && chmod +x /start.sh

# Run startup script
CMD ["/start.sh"]
