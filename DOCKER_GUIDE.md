# Docker Deployment Guide

## Local Development with Docker

### Prerequisites
- Docker and Docker Compose installed

### Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Admin: http://localhost:8000/admin

3. **Create demo users (optional):**
   ```bash
   docker-compose exec backend python manage.py create_users
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

### Demo Credentials
After running `create_users`:
- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager`, password: `manager123`
- **Tenant**: username: `tenant`, password: `tenant123`

## Render Deployment with Docker

### Backend (Django)
The `render.yaml` is configured to use Docker for both services.

**Backend Dockerfile** (`backend/Dockerfile`):
- Uses Python 3.11-slim
- Installs dependencies from requirements.txt
- Runs gunicorn on port 8000

**Required Environment Variables on Render:**
- `DATABASE_URL` - Auto-set from connected database
- `SECRET_KEY` - Auto-generated
- `DEBUG=False`
- `ALLOWED_HOSTS=randi-kwbw.onrender.com,.onrender.com`
- `CORS_ALLOWED_ORIGINS=https://rental-frontend-ent3.onrender.com`
- `CSRF_TRUSTED_ORIGINS=https://randi-kwbw.onrender.com,https://rental-frontend-ent3.onrender.com`
- `CREATE_DEMO_USERS=true` (optional)

### Frontend (React)
**Frontend Dockerfile** (`frontend/Dockerfile`):
- Multi-stage build
- Stage 1: Build React app with Node 18
- Stage 2: Serve with nginx on port 80
- Includes nginx config for React Router

**Required Environment Variables on Render:**
- `REACT_APP_API_URL=https://randi-kwbw.onrender.com/api`

### Deploy to Render

1. **Commit Docker files:**
   ```bash
   git add .
   git commit -m "Add Docker support"
   git push
   ```

2. **Render will auto-deploy:**
   - Backend builds using `backend/Dockerfile`
   - Frontend builds using `frontend/Dockerfile`
   - Both connect to the PostgreSQL database

3. **Verify deployment:**
   - Backend: https://randi-kwbw.onrender.com/api/auth/csrf/
   - Frontend: https://rental-frontend-ent3.onrender.com

## Docker Commands Cheat Sheet

```bash
# Build without cache
docker-compose build --no-cache

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access Django shell
docker-compose exec backend python manage.py shell

# Access database
docker-compose exec db psql -U rental_user -d rental_db

# Restart a service
docker-compose restart backend

# Remove all containers and volumes
docker-compose down -v
```

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is set correctly
- Verify migrations ran: `docker-compose exec backend python manage.py showmigrations`

### Frontend can't connect to backend
- Verify REACT_APP_API_URL includes `/api` path
- Check CORS_ALLOWED_ORIGINS includes frontend URL
- Clear browser cache and hard refresh

### Database connection errors
- Ensure DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Check database is running: `docker-compose ps`
