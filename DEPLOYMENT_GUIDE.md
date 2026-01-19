# Deployment Guide - Rental Management System

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment (Django)](#backend-deployment)
4. [Frontend Deployment (React)](#frontend-deployment)
5. [Database Migration](#database-migration)
6. [Production Settings](#production-settings)
7. [Deployment Platforms](#deployment-platforms)
8. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

### Code Preparation
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] All demo accounts work
- [ ] PDF generation functional
- [ ] Remove debug print statements
- [ ] Update `.gitignore` files
- [ ] Create requirements.txt
- [ ] Document environment variables

### Security
- [ ] Change SECRET_KEY in production
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Set CSRF_TRUSTED_ORIGINS
- [ ] Use HTTPS in production
- [ ] Secure database credentials
- [ ] Enable SECURE_SSL_REDIRECT
- [ ] Configure CORS properly

---

## Environment Setup

### Required Software
```bash
# Backend
Python 3.10+
Django 5.0
PostgreSQL 14+ (or SQLite for small deployments)

# Frontend
Node.js 18+ (or 16 with legacy OpenSSL)
npm 8+
React 17+

# Tools
Git
nginx (for production)
gunicorn (WSGI server)
supervisor (process manager)
```

### Environment Variables

Create `.env` file in `backend/rental_system/`:
```env
# Django Settings
SECRET_KEY=your-super-secret-key-change-this
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (PostgreSQL)
DB_NAME=rental_db
DB_USER=rental_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Security
CSRF_COOKIE_SECURE=True
SESSION_COOKIE_SECURE=True
SECURE_SSL_REDIRECT=True
```

---

## Backend Deployment

### 1. Prepare Django for Production

#### Install Production Dependencies
```bash
cd backend
pip install gunicorn psycopg2-binary python-decouple whitenoise
```

#### Update `requirements.txt`
```bash
pip freeze > requirements.txt
```

#### Update `settings.py`
```python
import os
from decouple import config

# Security Settings
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Database
if not DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

# Static Files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# WhiteNoise for static files
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... rest of middleware
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Security
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')
CSRF_TRUSTED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')
```

### 2. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### 3. Run Migrations
```bash
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Load Demo Data (Optional)
```bash
python manage.py seed_data
python manage.py create_users
```

### 6. Test with Gunicorn
```bash
gunicorn rental_system.wsgi:application --bind 0.0.0.0:8000
```

---

## Frontend Deployment

### 1. Update API URLs

Create `frontend/src/config.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com';
export { API_BASE_URL };
```

Update `frontend/src/services/api.js`:
```javascript
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  // ... rest of config
});
```

### 2. Update Environment Variables

Create `frontend/.env.production`:
```env
REACT_APP_API_URL=https://api.yourdomain.com
NODE_OPTIONS=--openssl-legacy-provider
```

### 3. Build for Production
```bash
cd frontend
npm run build
```

This creates optimized production build in `frontend/build/`

### 4. Test Production Build
```bash
npm install -g serve
serve -s build -p 3000
```

---

## Database Migration

### SQLite to PostgreSQL

#### 1. Dump Data
```bash
python manage.py dumpdata --natural-foreign --natural-primary \
  --exclude contenttypes --exclude auth.Permission > data.json
```

#### 2. Setup PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE rental_db;
CREATE USER rental_user WITH PASSWORD 'secure_password';
ALTER ROLE rental_user SET client_encoding TO 'utf8';
ALTER ROLE rental_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE rental_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE rental_db TO rental_user;
\q
```

#### 3. Update settings.py
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'rental_db',
        'USER': 'rental_user',
        'PASSWORD': 'secure_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### 4. Migrate and Load Data
```bash
python manage.py migrate
python manage.py loaddata data.json
```

---

## Deployment Platforms

### Option 1: DigitalOcean/AWS/Linode (VPS)

#### Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3-pip python3-venv nginx postgresql postgresql-contrib -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install supervisor
sudo apt install supervisor -y
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/rental-system
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/rental-system/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/rental-system/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/rental-system/backend/media/;
    }
}
```

#### Supervisor Configuration
```ini
# /etc/supervisor/conf.d/rental-system.conf
[program:rental-system]
command=/var/www/rental-system/backend/.venv/bin/gunicorn rental_system.wsgi:application --bind 127.0.0.1:8000 --workers 3
directory=/var/www/rental-system/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rental-system/gunicorn.log
```

#### Enable and Start Services
```bash
# Enable nginx config
sudo ln -s /etc/nginx/sites-available/rental-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Start supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start rental-system
```

#### SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option 2: Heroku

#### Backend (Django)
```bash
# Create Procfile
echo "web: gunicorn rental_system.wsgi" > backend/Procfile

# Create runtime.txt
echo "python-3.10.12" > backend/runtime.txt

# Login and create app
heroku login
heroku create rental-system-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=.herokuapp.com

# Deploy
git push heroku main

# Migrate
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

#### Frontend (React)
```bash
# Build
npm run build

# Deploy to Netlify/Vercel
# Follow platform-specific instructions
```

---

### Option 3: Docker

#### Create `Dockerfile` (Backend)
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "rental_system.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### Create `Dockerfile` (Frontend)
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: rental_db
      POSTGRES_USER: rental_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    command: gunicorn rental_system.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://rental_user:secure_password@db:5432/rental_db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Post-Deployment

### 1. Verify Deployment
- [ ] Visit https://yourdomain.com
- [ ] Test login with demo accounts
- [ ] Check all pages load
- [ ] Test CRUD operations
- [ ] Download PDF statement
- [ ] Export CSV files
- [ ] Test on mobile device

### 2. Monitoring Setup
```bash
# Install monitoring tools
pip install django-silk  # Request profiling
pip install sentry-sdk   # Error tracking

# Configure Sentry
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

### 3. Backup Strategy
```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump rental_db > /backups/rental_db_$DATE.sql

# Schedule with cron
0 2 * * * /path/to/backup-script.sh
```

### 4. Performance Optimization
- [ ] Enable gzip compression
- [ ] Configure browser caching
- [ ] Optimize images
- [ ] Minify CSS/JS
- [ ] Enable CDN
- [ ] Database indexing
- [ ] Query optimization

### 5. Security Audit
- [ ] Run security scanner
- [ ] Check for SQL injection
- [ ] Test XSS vulnerabilities
- [ ] Verify HTTPS everywhere
- [ ] Check file upload security
- [ ] Audit user permissions

---

## Maintenance

### Regular Tasks
- Weekly: Check logs for errors
- Monthly: Database backup verification
- Monthly: Security updates
- Quarterly: Performance audit
- Yearly: SSL certificate renewal

### Update Process
```bash
# Pull latest code
git pull origin main

# Update dependencies
pip install -r requirements.txt
npm install

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo supervisorctl restart rental-system
```

---

## Troubleshooting

### Common Issues

**Static files not loading**
```bash
python manage.py collectstatic --clear --noinput
```

**Database connection error**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U rental_user -d rental_db
```

**Gunicorn not starting**
```bash
# Check logs
tail -f /var/log/rental-system/gunicorn.log

# Test manually
gunicorn rental_system.wsgi:application --bind 0.0.0.0:8000
```

**Nginx 502 Bad Gateway**
```bash
# Check if gunicorn is running
ps aux | grep gunicorn

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## Support & Documentation

- Django Docs: https://docs.djangoproject.com/
- React Docs: https://reactjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Nginx Docs: https://nginx.org/en/docs/

---

## License & Credits

This rental management system is built with:
- Django REST Framework
- React
- PostgreSQL
- ReportLab (PDF generation)
- Recharts (data visualization)

For support, contact: admin@yourdomain.com
