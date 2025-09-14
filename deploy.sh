#!/bin/bash

# Voicera AI Microservices Deployment Script
# This script deploys the complete microservices architecture

set -e

echo "🚀 Starting Voicera AI Microservices Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p logs
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    mkdir -p nginx/ssl
    print_success "Directories created"
}

# Build microservices
build_services() {
    print_status "Building microservices..."
    
    # Build voice service
    print_status "Building voice service..."
    docker build -t voicera/voice-service:latest ./microservices/voice-service/
    
    # Build user service
    print_status "Building user service..."
    docker build -t voicera/user-service:latest ./microservices/user-service/
    
    # Build analytics service
    print_status "Building analytics service..."
    docker build -t voicera/analytics-service:latest ./microservices/analytics-service/
    
    # Build API gateway
    print_status "Building API gateway..."
    docker build -t voicera/api-gateway:latest ./microservices/api-gateway/
    
    print_success "All services built successfully"
}

# Start services with Docker Compose
start_services() {
    print_status "Starting services with Docker Compose..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Database
MONGO_URI=mongodb://admin:password@mongodb:27017/voicera?authSource=admin

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Services
VOICE_SERVICE_URL=http://voice-service:3001
USER_SERVICE_URL=http://user-service:3002
ANALYTICS_SERVICE_URL=http://analytics-service:3003

# API Keys
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here

# Client
CLIENT_ORIGIN=http://localhost:5173
EOF
        print_warning "Please update the .env file with your actual API keys and secrets"
    fi
    
    # Start services
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
    done
    print_success "Redis is healthy"
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB..."
    until docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
        sleep 2
    done
    print_success "MongoDB is healthy"
    
    # Wait for services
    services=("voice-service" "user-service" "analytics-service" "api-gateway")
    for service in "${services[@]}"; do
        print_status "Waiting for $service..."
        until curl -f http://localhost:3000/health > /dev/null 2>&1; do
            sleep 5
        done
        print_success "$service is healthy"
    done
}

# Display service information
show_service_info() {
    print_success "🎉 Voicera AI Microservices deployed successfully!"
    echo ""
    echo "📊 Service URLs:"
    echo "  • API Gateway: http://localhost:3000"
    echo "  • Voice Service: http://localhost:3001"
    echo "  • User Service: http://localhost:3002"
    echo "  • Analytics Service: http://localhost:3003"
    echo ""
    echo "🔍 Monitoring:"
    echo "  • Prometheus: http://localhost:9090"
    echo "  • Grafana: http://localhost:3001 (admin/admin)"
    echo "  • Jaeger: http://localhost:16686"
    echo ""
    echo "📚 API Documentation:"
    echo "  • API Docs: http://localhost:3000/api/docs"
    echo "  • Health Check: http://localhost:3000/health"
    echo "  • Metrics: http://localhost:3000/metrics"
    echo ""
    echo "🛠️ Management Commands:"
    echo "  • View logs: docker-compose logs -f [service-name]"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart service: docker-compose restart [service-name]"
    echo "  • Scale service: docker-compose up -d --scale [service-name]=[count]"
}

# Main deployment function
main() {
    print_status "Starting Voicera AI Microservices Deployment..."
    
    check_docker
    check_docker_compose
    create_directories
    build_services
    start_services
    wait_for_services
    show_service_info
    
    print_success "Deployment completed successfully! 🎉"
}

# Run main function
main "$@"
