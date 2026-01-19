#!/bin/bash

# Setup script for Rental Management System

echo "🏢 Setting up Rental Management System..."

# Backend setup
echo "\n📦 Setting up Backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py makemigrations
python manage.py migrate

echo "\n✅ Backend setup complete!"
echo "To start the backend server:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"

# Frontend setup
cd ../frontend
echo "\n📦 Setting up Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

echo "\n✅ Frontend setup complete!"
echo "To start the frontend server:"
echo "  cd frontend"
echo "  npm start"

echo "\n🎉 Setup complete! You can now start both servers."
