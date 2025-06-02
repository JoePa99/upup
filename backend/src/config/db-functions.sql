-- Database Functions for UPUP Platform
-- This file contains PostgreSQL functions needed for the application

-- First, add the missing auth_user_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Create an index on auth_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Function to set tenant context for Row Level Security
CREATE OR REPLACE FUNCTION set_tenant_context(
  tenant_id INTEGER,
  user_id INTEGER DEFAULT NULL,
  is_admin BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  -- Set the tenant context
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
  
  -- Set super admin flag
  PERFORM set_config('app.is_super_admin', is_admin::TEXT, false);
  
  -- Set user context if provided
  IF user_id IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', user_id::TEXT, false);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user and tenant information for the authenticated user
CREATE OR REPLACE FUNCTION get_user_tenant_info()
RETURNS TABLE (
  user_id INTEGER,
  tenant_id INTEGER,
  tenant_name VARCHAR(255),
  user_role VARCHAR(50),
  user_email VARCHAR(255),
  user_first_name VARCHAR(100),
  user_last_name VARCHAR(100),
  tenant_subdomain VARCHAR(100),
  tenant_status VARCHAR(20),
  subscription_plan VARCHAR(50)
) AS $$
BEGIN
  -- Get the authenticated user's ID from the JWT
  -- This assumes Supabase auth.uid() returns the authenticated user's UUID
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.tenant_id,
    t.name as tenant_name,
    u.role as user_role,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    t.subdomain as tenant_subdomain,
    t.status as tenant_status,
    t.subscription_plan
  FROM users u
  INNER JOIN tenants t ON u.tenant_id = t.id
  WHERE u.auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user by auth_user_id (for server-side operations)
CREATE OR REPLACE FUNCTION get_user_by_auth_id(auth_user_uuid UUID)
RETURNS TABLE (
  user_id INTEGER,
  tenant_id INTEGER,
  tenant_name VARCHAR(255),
  user_role VARCHAR(50),
  user_email VARCHAR(255),
  user_first_name VARCHAR(100),
  user_last_name VARCHAR(100),
  tenant_subdomain VARCHAR(100),
  tenant_status VARCHAR(20),
  subscription_plan VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.tenant_id,
    t.name as tenant_name,
    u.role as user_role,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    t.subdomain as tenant_subdomain,
    t.status as tenant_status,
    t.subscription_plan
  FROM users u
  INNER JOIN tenants t ON u.tenant_id = t.id
  WHERE u.auth_user_id = auth_user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new user and tenant (used during registration)
CREATE OR REPLACE FUNCTION create_tenant_and_user(
  p_auth_user_id UUID,
  p_email VARCHAR(255),
  p_first_name VARCHAR(100),
  p_last_name VARCHAR(100),
  p_tenant_name VARCHAR(255),
  p_subdomain VARCHAR(100)
)
RETURNS TABLE (
  tenant_id INTEGER,
  user_id INTEGER
) AS $$
DECLARE
  new_tenant_id INTEGER;
  new_user_id INTEGER;
BEGIN
  -- Create the tenant
  INSERT INTO tenants (name, subdomain, admin_email, status, subscription_plan)
  VALUES (p_tenant_name, p_subdomain, p_email, 'active', 'free')
  RETURNING id INTO new_tenant_id;
  
  -- Create the user as admin of the tenant
  INSERT INTO users (tenant_id, auth_user_id, email, first_name, last_name, role)
  VALUES (new_tenant_id, p_auth_user_id, p_email, p_first_name, p_last_name, 'admin')
  RETURNING id INTO new_user_id;
  
  -- Return the IDs
  RETURN QUERY SELECT new_tenant_id, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a subdomain is available
CREATE OR REPLACE FUNCTION is_subdomain_available(subdomain_to_check VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM tenants WHERE subdomain = subdomain_to_check
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_tenant_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_auth_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_tenant_context(INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_tenant_and_user(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION is_subdomain_available(VARCHAR) TO authenticated;

-- Grant execute permissions to service role (for server-side operations)
GRANT EXECUTE ON FUNCTION get_user_tenant_info() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_by_auth_id(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION set_tenant_context(INTEGER, INTEGER, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION create_tenant_and_user(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION is_subdomain_available(VARCHAR) TO service_role;