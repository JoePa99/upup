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

-- Function to get relevant knowledge for AI generation
CREATE OR REPLACE FUNCTION get_relevant_knowledge(
  p_tenant_id INTEGER,
  p_user_id INTEGER,
  p_context VARCHAR(100), -- 'content_generation', 'template_creation', etc.
  p_category VARCHAR(100) DEFAULT NULL,
  p_search_terms TEXT DEFAULT NULL
)
RETURNS TABLE (
  knowledge_type VARCHAR(20),
  id INTEGER,
  title VARCHAR(255),
  content TEXT,
  category VARCHAR(100),
  relevance_score INTEGER
) AS $$
BEGIN
  -- Return hierarchical knowledge in order of specificity (user -> company -> platform)
  RETURN QUERY
  
  -- User knowledge (highest priority)
  SELECT 
    'user'::VARCHAR(20) as knowledge_type,
    uk.id,
    uk.title,
    uk.content,
    uk.document_type as category,
    3 as relevance_score
  FROM user_knowledge uk
  WHERE uk.tenant_id = p_tenant_id 
    AND uk.user_id = p_user_id
    AND uk.status = 'active'
    AND (p_category IS NULL OR uk.document_type ILIKE '%' || p_category || '%')
    AND (p_search_terms IS NULL OR 
         uk.content ILIKE '%' || p_search_terms || '%' OR 
         uk.title ILIKE '%' || p_search_terms || '%')
  ORDER BY uk.created_at DESC
  LIMIT 5
  
  UNION ALL
  
  -- Company knowledge (medium priority)
  SELECT 
    'company'::VARCHAR(20) as knowledge_type,
    ck.id,
    ck.title,
    ck.content,
    ck.category,
    2 as relevance_score
  FROM company_knowledge ck
  WHERE ck.tenant_id = p_tenant_id
    AND ck.status = 'active'
    AND (p_category IS NULL OR ck.category ILIKE '%' || p_category || '%')
    AND (p_search_terms IS NULL OR 
         ck.content ILIKE '%' || p_search_terms || '%' OR 
         ck.title ILIKE '%' || p_search_terms || '%')
  ORDER BY ck.created_at DESC
  LIMIT 5
  
  UNION ALL
  
  -- Platform knowledge (lowest priority, but foundational)
  SELECT 
    'platform'::VARCHAR(20) as knowledge_type,
    pk.id,
    pk.title,
    pk.content,
    pk.category,
    1 as relevance_score
  FROM platform_knowledge pk
  WHERE pk.status = 'active'
    AND (p_category IS NULL OR pk.category ILIKE '%' || p_category || '%')
    AND (p_search_terms IS NULL OR 
         pk.content ILIKE '%' || p_search_terms || '%' OR 
         pk.title ILIKE '%' || p_search_terms || '%')
  ORDER BY pk.created_at DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track knowledge usage
CREATE OR REPLACE FUNCTION track_knowledge_usage(
  p_tenant_id INTEGER,
  p_user_id INTEGER,
  p_knowledge_type VARCHAR(20),
  p_knowledge_id INTEGER,
  p_usage_context VARCHAR(50),
  p_generation_id INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO knowledge_usage (
    tenant_id, user_id, knowledge_type, knowledge_id, 
    usage_context, generation_id
  ) VALUES (
    p_tenant_id, p_user_id, p_knowledge_type, p_knowledge_id,
    p_usage_context, p_generation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get knowledge analytics for Super Admin
CREATE OR REPLACE FUNCTION get_platform_knowledge_analytics()
RETURNS TABLE (
  total_platform_docs INTEGER,
  total_company_docs BIGINT,
  total_user_docs BIGINT,
  most_used_categories TEXT[],
  usage_last_30_days BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM platform_knowledge WHERE status = 'active'),
    (SELECT COUNT(*) FROM company_knowledge WHERE status = 'active'),
    (SELECT COUNT(*) FROM user_knowledge WHERE status = 'active'),
    (SELECT ARRAY_AGG(category) FROM (
      SELECT category, COUNT(*) as usage_count
      FROM knowledge_usage ku
      JOIN platform_knowledge pk ON ku.knowledge_id = pk.id
      WHERE ku.knowledge_type = 'platform'
        AND ku.created_at > NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY usage_count DESC
      LIMIT 5
    ) t),
    (SELECT COUNT(*) FROM knowledge_usage WHERE created_at > NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company knowledge analytics for Company Admin
CREATE OR REPLACE FUNCTION get_company_knowledge_analytics(p_tenant_id INTEGER)
RETURNS TABLE (
  total_company_docs BIGINT,
  total_user_docs BIGINT,
  most_active_users TEXT[],
  popular_categories TEXT[],
  usage_last_30_days BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM company_knowledge WHERE tenant_id = p_tenant_id AND status = 'active'),
    (SELECT COUNT(*) FROM user_knowledge WHERE tenant_id = p_tenant_id AND status = 'active'),
    (SELECT ARRAY_AGG(user_name) FROM (
      SELECT CONCAT(u.first_name, ' ', u.last_name) as user_name, COUNT(*) as doc_count
      FROM user_knowledge uk
      JOIN users u ON uk.user_id = u.id
      WHERE uk.tenant_id = p_tenant_id
        AND uk.created_at > NOW() - INTERVAL '30 days'
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY doc_count DESC
      LIMIT 5
    ) t),
    (SELECT ARRAY_AGG(category) FROM (
      SELECT category, COUNT(*) as usage_count
      FROM knowledge_usage ku
      WHERE ku.tenant_id = p_tenant_id
        AND ku.created_at > NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY usage_count DESC
      LIMIT 5
    ) t),
    (SELECT COUNT(*) FROM knowledge_usage WHERE tenant_id = p_tenant_id AND created_at > NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_tenant_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_auth_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_tenant_context(INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_tenant_and_user(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION is_subdomain_available(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_relevant_knowledge(INTEGER, INTEGER, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_knowledge_usage(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_knowledge_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_knowledge_analytics(INTEGER) TO authenticated;

-- Grant execute permissions to service role (for server-side operations)
GRANT EXECUTE ON FUNCTION get_user_tenant_info() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_by_auth_id(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION set_tenant_context(INTEGER, INTEGER, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION create_tenant_and_user(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION is_subdomain_available(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION get_relevant_knowledge(INTEGER, INTEGER, VARCHAR, VARCHAR, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION track_knowledge_usage(INTEGER, INTEGER, VARCHAR, INTEGER, VARCHAR, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_platform_knowledge_analytics() TO service_role;
GRANT EXECUTE ON FUNCTION get_company_knowledge_analytics(INTEGER) TO service_role;