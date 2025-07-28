#!/bin/bash

echo "Setting up PostgreSQL database for Synergy AI..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    echo ""
    echo "On macOS with Homebrew: brew services start postgresql@15"
    echo "On Linux: sudo systemctl start postgresql"
    echo "On Windows: Start PostgreSQL service from Services"
    exit 1
fi

echo "PostgreSQL is running ✓"

# Create database and user
echo "Creating database and user..."
psql postgres << EOF
-- Create user
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'synergy_user') THEN
        CREATE USER synergy_user WITH PASSWORD 'synergy_password';
    END IF;
END
\$\$;

-- Create database
SELECT 'CREATE DATABASE synergy_ai OWNER synergy_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'synergy_ai')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE synergy_ai TO synergy_user;
EOF

echo "Database and user created ✓"

# Run schema
echo "Creating database schema..."
psql synergy_ai < database/schema.sql

echo "Schema created ✓"

# Update permissions
echo "Setting up permissions..."
psql synergy_ai << EOF
GRANT ALL ON SCHEMA public TO synergy_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO synergy_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO synergy_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO synergy_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO synergy_user;
EOF

echo "Permissions set ✓"
echo ""
echo "Database setup complete! 🎉"
echo ""
echo "Your database connection details:"
echo "Database: synergy_ai"
echo "Username: synergy_user"
echo "Password: synergy_password"
echo "Host: localhost"
echo "Port: 5432"
echo ""
echo "Update your .env file with:"
echo "DATABASE_URL=postgresql://synergy_user:synergy_password@localhost:5432/synergy_ai"