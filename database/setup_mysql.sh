#!/bin/bash

# MySQL/MariaDB setup script for Castingly migration

echo "================================"
echo "Castingly MySQL Database Setup"
echo "================================"

# Database configuration
DB_NAME=${DB_NAME:-castingly}
DB_USER=${DB_USER:-nikon}
DB_PASSWORD=${DB_PASSWORD:-'@0509man1hattaN'}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}

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

# Check if MySQL/MariaDB is running
echo -n "Checking MySQL/MariaDB connection... "
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Cannot connect to MySQL/MariaDB${NC}"
    echo "Please ensure MySQL/MariaDB is running and credentials are correct"
    exit 1
fi

# Check if database exists
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep "$DB_NAME")

if [ ! -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "Creating new database..."
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    fi
else
    echo "Creating database '$DB_NAME'..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

# Run schema
echo ""
echo "Applying database schema..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/schema_mysql.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema applied successfully${NC}"
else
    echo -e "${RED}✗ Failed to apply schema${NC}"
    exit 1
fi

# Check table creation
echo ""
echo "Verifying tables..."
TABLE_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s 2>/dev/null | tail -1)
echo -e "${GREEN}✓ Created $TABLE_COUNT tables${NC}"

# Install Node.js dependencies if needed
echo ""
echo "Checking Node.js dependencies..."
if ! npm list csv-parser >/dev/null 2>&1; then
    echo "Installing csv-parser..."
    npm install csv-parser
fi

if ! npm list mysql2 >/dev/null 2>&1; then
    echo "Installing mysql2..."
    npm install mysql2
fi

# Run migration
echo ""
echo "================================"
echo "Starting Actor Migration"
echo "================================"
echo ""
echo "This will import ${YELLOW}1,144 actors${NC} from Actors.csv"
echo "Images will be linked from: downloaded_images/"
echo "Resumes will be linked from: downloaded_resumes/"
echo ""
read -p "Do you want to run the actor migration now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    node database/migrate_actors_mysql.js
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Database Summary:"
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    ACTOR_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM users WHERE role='actor';" -s 2>/dev/null | tail -1)
    MEDIA_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM media;" -s 2>/dev/null | tail -1)
    echo "  - Actors migrated: $ACTOR_COUNT"
    echo "  - Media files linked: $MEDIA_COUNT"
fi
echo ""
echo "Next steps:"
echo "1. Update your .env file with database credentials"
echo "2. Start the Next.js development server: npm run dev"
echo "3. Images will be served from /downloaded_images/"
echo "4. Resumes will be served from /downloaded_resumes/"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "  - All actors have password: changeme123"
echo "  - Implement password reset on first login!"
echo "  - Update authentication to use bcrypt for production"