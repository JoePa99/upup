const db = require('./database');
const { supabaseAdmin } = require('./supabase');

// Initialize the database with tables using Supabase SQL
const initializeDatabase = async () => {
  // Check if running in Vercel environment
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment - skipping direct database initialization');
    console.log('Database will be initialized using Supabase UI or SQL Editor');
    return;
  }

  const client = await db.getClient();
  
  try {
    console.log('Initializing database tables...');
    await client.query('BEGIN');
    
    // Create tenants table in public schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE NOT NULL,
        admin_email VARCHAR(255) NOT NULL,
        stripe_customer_id VARCHAR(100),
        subscription_plan VARCHAR(50) DEFAULT 'free',
        subscription_status VARCHAR(50) DEFAULT 'active',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create tenant_usage table for tracking usage metrics
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_usage (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        ai_api_calls INTEGER DEFAULT 0,
        storage_used_bytes BIGINT DEFAULT 0,
        emails_sent INTEGER DEFAULT 0,
        audio_processed_seconds INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, date)
      )
    `);
    
    // Create super_admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create subscription_plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        stripe_price_id VARCHAR(100),
        monthly_price DECIMAL(10,2) NOT NULL,
        ai_request_limit INTEGER NOT NULL,
        storage_limit_gb INTEGER NOT NULL,
        email_limit INTEGER NOT NULL,
        audio_processing_limit_minutes INTEGER NOT NULL,
        description TEXT,
        features JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Insert default subscription plans
    await client.query(`
      INSERT INTO subscription_plans (
        name, monthly_price, ai_request_limit, storage_limit_gb, 
        email_limit, audio_processing_limit_minutes, description
      ) 
      VALUES 
        ('free', 0, 100, 1, 100, 60, 'Free tier with limited usage'),
        ('professional', 49, 1000, 10, 1000, 300, 'Professional tier for small businesses'),
        ('business', 149, 5000, 50, 5000, 1000, 'Business tier for growing companies')
      ON CONFLICT (name) DO NOTHING
    `);
    
    // Create tenant-specific tables for each feature module
    
    // Users table (per tenant)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        auth_user_id UUID,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, email),
        UNIQUE(auth_user_id)
      )
    `);
    
    // Add Row Level Security (RLS) policies for users
    await client.query(`
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON users
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      CREATE POLICY super_admin_policy ON users
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);
    
    // Brand guidelines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS brand_guidelines (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        name VARCHAR(100) NOT NULL,
        logo_url TEXT,
        primary_color VARCHAR(20),
        secondary_color VARCHAR(20),
        typography TEXT,
        voice_tone TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Add RLS for brand_guidelines
    await client.query(`
      ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON brand_guidelines
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      CREATE POLICY super_admin_policy ON brand_guidelines
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);
    
    // Content templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_templates (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Add RLS for content_templates
    await client.query(`
      ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON content_templates
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      CREATE POLICY super_admin_policy ON content_templates
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);
    
    // Generated content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_content (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        template_id INTEGER REFERENCES content_templates(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Add RLS for generated_content
    await client.query(`
      ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON generated_content
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      CREATE POLICY super_admin_policy ON generated_content
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);
    
    // Pinned sentences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pinned_sentences (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        sentence_text TEXT NOT NULL,
        source_title VARCHAR(255) NOT NULL,
        source_type VARCHAR(50) NOT NULL, -- 'content', 'growth', 'market', 'customer', 'template'
        source_metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Add RLS for pinned_sentences
    await client.query(`
      ALTER TABLE pinned_sentences ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON pinned_sentences
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      CREATE POLICY super_admin_policy ON pinned_sentences
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);
    
    // Content generations table (tracks all AI-generated content)
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_generations (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        generation_type VARCHAR(50) NOT NULL, -- 'content', 'growth', 'market', 'customer', 'hr_template', 'legal_template', 'sales_template'
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        input_parameters JSONB NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Add RLS for content_generations
    await client.query(`
      ALTER TABLE content_generations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON content_generations
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      CREATE POLICY super_admin_policy ON content_generations
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);
    
    // Created content from pins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS created_content (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        source_pins INTEGER[] NOT NULL, -- Array of pinned_sentences ids
        creation_type VARCHAR(50) DEFAULT 'strategic', -- 'strategic', 'expanded', etc.
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Add RLS for created_content
    await client.query(`
      ALTER TABLE created_content ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON created_content
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      CREATE POLICY super_admin_policy ON created_content
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);
    
    // Knowledge base tables for hierarchical knowledge system
    
    // Super Admin Knowledge Base (Platform Level)
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_knowledge (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        document_type VARCHAR(50) NOT NULL, -- 'industry_standards', 'compliance', 'best_practices', 'templates'
        category VARCHAR(100), -- 'HR', 'Legal', 'Sales', 'Marketing', 'General'
        tags TEXT[], -- Array of searchable tags
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'draft'
        created_by_super_admin VARCHAR(255), -- Super admin email who created it
        version INTEGER DEFAULT 1,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Company Knowledge Base (Tenant Level)
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_knowledge (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        document_type VARCHAR(50) NOT NULL, -- 'brand_guidelines', 'policies', 'procedures', 'company_info'
        category VARCHAR(100), -- 'Brand', 'HR', 'Legal', 'Sales', 'Product', 'Culture'
        tags TEXT[], -- Array of searchable tags
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'draft'
        created_by INTEGER REFERENCES users(id), -- Company admin who created it
        approved_by INTEGER REFERENCES users(id), -- If approval workflow is needed
        version INTEGER DEFAULT 1,
        is_public BOOLEAN DEFAULT false, -- Whether this knowledge is shared across company
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Add RLS for company_knowledge
    await client.query(`
      ALTER TABLE company_knowledge ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS tenant_isolation_policy ON company_knowledge;
      CREATE POLICY tenant_isolation_policy ON company_knowledge
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      DROP POLICY IF EXISTS super_admin_policy ON company_knowledge;
      CREATE POLICY super_admin_policy ON company_knowledge
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);

    // User Session Knowledge (User Level)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_knowledge (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        document_type VARCHAR(50) NOT NULL, -- 'project_doc', 'research', 'notes', 'brief'
        project_name VARCHAR(255), -- Optional project grouping
        tags TEXT[], -- Array of searchable tags
        status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'draft'
        is_session_specific BOOLEAN DEFAULT true, -- Whether this is just for current session
        expires_at TIMESTAMP, -- Optional expiration for session-specific docs
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Add RLS for user_knowledge
    await client.query(`
      ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS tenant_user_isolation_policy ON user_knowledge;
      CREATE POLICY tenant_user_isolation_policy ON user_knowledge
        USING (
          tenant_id = current_setting('app.current_tenant_id', true)::INTEGER 
          AND user_id = current_setting('app.current_user_id', true)::INTEGER
        );
      
      DROP POLICY IF EXISTS super_admin_policy ON user_knowledge;
      CREATE POLICY super_admin_policy ON user_knowledge
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);

    // Knowledge Usage Tracking (for analytics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_usage (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        knowledge_type VARCHAR(20) NOT NULL, -- 'platform', 'company', 'user'
        knowledge_id INTEGER NOT NULL, -- ID of the knowledge document used
        usage_context VARCHAR(50), -- 'content_generation', 'template_creation', etc.
        generation_id INTEGER REFERENCES content_generations(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Add RLS for knowledge_usage
    await client.query(`
      ALTER TABLE knowledge_usage ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS tenant_isolation_policy ON knowledge_usage;
      CREATE POLICY tenant_isolation_policy ON knowledge_usage
        USING (tenant_id = current_setting('app.current_tenant_id', true)::INTEGER);
      
      DROP POLICY IF EXISTS super_admin_policy ON knowledge_usage;
      CREATE POLICY super_admin_policy ON knowledge_usage
        USING (current_setting('app.is_super_admin', true)::BOOLEAN = true);
    `);

    // Knowledge Search Index (for semantic search optimization)
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_search_index (
        id SERIAL PRIMARY KEY,
        knowledge_type VARCHAR(20) NOT NULL, -- 'platform', 'company', 'user'
        knowledge_id INTEGER NOT NULL,
        tenant_id INTEGER, -- NULL for platform knowledge
        search_vector TSVECTOR, -- Full-text search vector
        embedding_vector VECTOR(1536), -- OpenAI embedding vector (if using pgvector)
        last_indexed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_company_knowledge_tenant ON company_knowledge(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_company_knowledge_category ON company_knowledge(category);
      CREATE INDEX IF NOT EXISTS idx_company_knowledge_tags ON company_knowledge USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_user_knowledge_tenant_user ON user_knowledge(tenant_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_user_knowledge_project ON user_knowledge(project_name);
      CREATE INDEX IF NOT EXISTS idx_platform_knowledge_category ON platform_knowledge(category);
      CREATE INDEX IF NOT EXISTS idx_platform_knowledge_tags ON platform_knowledge USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_knowledge_usage_tracking ON knowledge_usage(tenant_id, user_id, created_at);
    `);

    // Create database functions
    await createDatabaseFunctions(client);
    
    await client.query('COMMIT');
    console.log('Database tables and functions created successfully');
    
    // Set up RLS policies and functions in Supabase
    await setupSupabaseRLS();
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Create database functions
const createDatabaseFunctions = async (client) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log('Creating database functions...');
    
    // Read the SQL functions file
    const functionsPath = path.join(__dirname, 'db-functions.sql');
    const functionsSQL = fs.readFileSync(functionsPath, 'utf8');
    
    // Execute the functions SQL
    await client.query(functionsSQL);
    
    console.log('Database functions created successfully');
  } catch (error) {
    console.error('Error creating database functions:', error);
    // Don't throw error to allow tables to be created even if functions fail
  }
};

// Set up Row Level Security functions and policies in Supabase
const setupSupabaseRLS = async () => {
  // Skip if required environment variables are missing
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('Skipping Supabase RLS setup - environment variables missing');
    return;
  }

  try {
    // Create function to set tenant context
    const { error: fnError } = await supabaseAdmin.rpc('create_set_tenant_context_function', {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: `
        CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id INTEGER, is_admin BOOLEAN DEFAULT false)
        RETURNS VOID AS $$
        BEGIN
          PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, false);
          PERFORM set_config('app.is_super_admin', is_admin::TEXT, false);
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (fnError) {
      console.error('Error creating tenant context function:', fnError);
    } else {
      console.log('Tenant context function created successfully');
    }
    
  } catch (error) {
    console.error('Error setting up Supabase RLS:', error);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      // Exit with success in Vercel environment to allow deployment to proceed
      if (process.env.VERCEL) {
        console.log('Continuing deployment despite database initialization failure');
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
}

module.exports = { initializeDatabase };