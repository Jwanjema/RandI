#!/usr/bin/env bash
# exit on error
set -o errexit

cd backend

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

# Optionally create demo users (safe and idempotent)
# Enable by setting CREATE_DEMO_USERS=true in your environment
if [ "${CREATE_DEMO_USERS}" = "true" ] || [ "${CREATE_DEMO_USERS}" = "1" ]; then
	echo "Creating demo users (admin/manager/tenant if possible)..."
	python manage.py create_users || true
fi

# Create superuser if it doesn't exist (optional)
# python manage.py shell << END
# from django.contrib.auth import get_user_model
# User = get_user_model()
# if not User.objects.filter(username='admin').exists():
#     User.objects.create_superuser('admin', 'admin@rental.com', 'admin123')
# END
