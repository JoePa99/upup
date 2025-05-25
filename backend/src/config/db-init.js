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
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, email)
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
    
    await client.query('COMMIT');
    console.log('Database tables created successfully');
    
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