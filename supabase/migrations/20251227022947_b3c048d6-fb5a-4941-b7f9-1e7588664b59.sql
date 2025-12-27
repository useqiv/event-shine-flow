-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move commonly used extensions to extensions schema
-- Note: Some extensions may already be in the correct schema or not installed

-- Recreate extensions in the extensions schema
-- First drop from public if they exist, then create in extensions schema

-- For pg_graphql (if exists)
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- For pg_stat_statements (if exists)
DROP EXTENSION IF EXISTS pg_stat_statements CASCADE;

-- For pgcrypto - commonly used
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- For uuid-ossp - commonly used for UUID generation
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- For pgjwt (if exists)
DROP EXTENSION IF EXISTS pgjwt CASCADE;

-- Update search path to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Grant execute on all functions in extensions schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;