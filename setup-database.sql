-- Database setup script for Synergy AI
-- Run this after installing PostgreSQL

-- Connect as postgres user first, then run these commands:

-- Create a new user for the application
CREATE USER synergy_user WITH PASSWORD 'synergy_password';

-- Create the database
CREATE DATABASE synergy_ai OWNER synergy_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE synergy_ai TO synergy_user;
GRANT CREATE ON DATABASE synergy_ai TO synergy_user;

-- Connect to the new database
\c synergy_ai;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO synergy_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO synergy_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO synergy_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO synergy_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO synergy_user;