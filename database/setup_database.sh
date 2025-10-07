#!/bin/bash

# Database setup script for Castingly migration

echo "================================"
echo "Castingly Database Setup"
echo "================================"

# Database configuration
DB_NAME=${DB_NAME:-castingly}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Database Configuration:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Function to check if database exists
db_exists() {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME
}

# Check if PostgreSQL is running
echo -n "Checking PostgreSQL connection... "
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Cannot connect to PostgreSQL${NC}"
    echo "Please ensure PostgreSQL is running and accessible"
    exit 1
fi

# Create database if it doesn't exist
if db_exists; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "Creating new database..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    fi
else
    echo "Creating database '$DB_NAME'..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
fi

# Run schema
echo ""
echo "Applying database schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema applied successfully${NC}"
else
    echo -e "${RED}✗ Failed to apply schema${NC}"
    exit 1
fi

# Install Node.js dependencies if needed
echo ""
echo "Checking Node.js dependencies..."
if ! npm list csv-parser >/dev/null 2>&1; then
    echo "Installing csv-parser..."
    npm install csv-parser
fi

if ! npm list pg >/dev/null 2>&1; then
    echo "Installing pg (PostgreSQL client)..."
    npm install pg
fi

# Run migration
echo ""
echo "================================"
echo "Starting Actor Migration"
echo "================================"
read -p "Do you want to run the actor migration now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    node database/migrate_actors_complete.js
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with database credentials"
echo "2. Start the Next.js development server: npm run dev"
echo "3. Images will be served from /downloaded_images and /downloaded_resumes"
echo ""
echo "Default actor login:"
echo "  Password for all actors: changeme123"
echo "  (Implement password reset on first login!)"