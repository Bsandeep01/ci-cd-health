#!/bin/bash

# CI/CD Pipeline Health Dashboard Setup Script

echo "🚀 CI/CD Pipeline Health Dashboard Setup"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file with your configuration:"
    echo "   1. Add your GitHub Personal Access Token"
    echo "   2. Configure your GitHub repository details"
    echo "   3. Set up email configuration"
    echo "   4. (Optional) Add Slack webhook URL"
    echo ""
    echo "   Then run this script again to start the application."
    exit 0
fi

# Check if required environment variables are set
echo "🔍 Checking environment configuration..."

source .env

if [ -z "$GITHUB_TOKEN" ] || [ "$GITHUB_TOKEN" = "your_github_personal_access_token" ]; then
    echo "❌ GITHUB_TOKEN is not configured. Please edit .env file."
    exit 1
fi

if [ -z "$GITHUB_OWNER" ] || [ "$GITHUB_OWNER" = "your_github_username_or_org" ]; then
    echo "❌ GITHUB_OWNER is not configured. Please edit .env file."
    exit 1
fi

if [ -z "$GITHUB_REPO" ] || [ "$GITHUB_REPO" = "your_repository_name" ]; then
    echo "❌ GITHUB_REPO is not configured. Please edit .env file."
    exit 1
fi

if [ -z "$EMAIL_USER" ] || [ "$EMAIL_USER" = "your_email@gmail.com" ]; then
    echo "❌ EMAIL_USER is not configured. Please edit .env file."
    exit 1
fi

if [ -z "$EMAIL_PASSWORD" ] || [ "$EMAIL_PASSWORD" = "your_app_password" ]; then
    echo "❌ EMAIL_PASSWORD is not configured. Please edit .env file."
    exit 1
fi

echo "✅ Environment configuration looks good"

# Create data directory if it doesn't exist
mkdir -p data

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running successfully!"
    echo ""
    echo "🌐 Access the dashboard at: http://localhost:3000"
    echo "🔧 API endpoint: http://localhost:5000"
    echo ""
    echo "📋 Useful commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop services: docker-compose down"
    echo "   - Restart services: docker-compose restart"
    echo "   - Update application: docker-compose up --build -d"
    echo ""
    echo "📚 Documentation:"
    echo "   - README.md - Main documentation"
    echo "   - docs/requirements-analysis.md - Requirements analysis"
    echo "   - docs/tech-design.md - Technical design"
else
    echo "❌ Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
