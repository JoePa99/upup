const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

let pool;
let supabaseAdmin;

// Check if running in Vercel environment
const isVercelEnv = !!process.env.VERCEL;

// Only create connection pool if DATABASE_URL or DB credentials are provided
if (process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_USER)) {
  // Create connection pool using DATABASE_URL or individual parameters
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // If DATABASE_URL is not provided, use individual parameters
    host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
    port: process.env.DATABASE_URL ? undefined : process.env.DB_PORT || 5432,
    database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
    user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Additional pool configuration
    max: 20, // Maximum number of clients
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });

  // Log successful connection or error
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database via Pool');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit if in Vercel environment
    if (!isVercelEnv) {
      process.exit(-1);
    }
  });
} else {
  console.log('No database connection configured. Set DATABASE_URL or DB_* environment variables.');
}

// Initialize Supabase client if environment variables are available
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_KEY, 
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabaseAdmin = null;
  }
} else {
  console.log('No Supabase connection configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  supabaseAdmin = null;
}

/**
 * Execute a database query via direct SQL
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
const query = async (text, params) => {
  if (!pool) {
    console.error('Database connection not configured');
    return { rows: [] };
  }
  return pool.query(text, params);
};

/**
 * Get a client from the pool
 * @returns {Promise} - A PostgreSQL client
 */
const getClient = async () => {
  if (!pool) {
    // In development, create a mock client for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Database connection not configured. Using mock client for development.');
      return {
        query: async () => ({ rows: [] }),
        release: () => {}
      };
    }
    throw new Error('Database connection not configured');
  }
  return pool.connect();
};

/**
 * Execute a query using Supabase client
 * This is useful for operations that benefit from Supabase features
 * such as row-level security
 * @param {string} table - Table name
 * @param {Object} options - Query options
 * @returns {Promise} - Query result
 */
const supabaseQuery = async (table, options = {}) => {
  if (!supabaseAdmin) {
    console.error('Supabase client not initialized');
    return { data: [], error: new Error('Supabase client not initialized') };
  }
  
  let query = supabaseAdmin.from(table);
  
  if (options.select) {
    query = query.select(options.select);
  }
  
  if (options.filters) {
    options.filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
  }
  
  if (options.eq) {
    Object.keys(options.eq).forEach(key => {
      query = query.eq(key, options.eq[key]);
    });
  }
  
  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending });
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.range) {
    query = query.range(options.range.from, options.range.to);
  }
  
  return query;
};

/**
 * Insert data into a table using Supabase
 * @param {string} table - Table name
 * @param {Object|Array} data - Data to insert
 * @param {Object} options - Options for the insert
 * @returns {Promise} - Insert result
 */
const supabaseInsert = async (table, data, options = {}) => {
  if (!supabaseAdmin) {
    console.error('Supabase client not initialized');
    return { data: [], error: new Error('Supabase client not initialized') };
  }
  
  let query = supabaseAdmin.from(table).insert(data);
  
  if (options.returning) {
    query = query.select();
  }
  
  return query;
};

/**
 * Update data in a table using Supabase
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} match - Conditions to match
 * @param {Object} options - Options for the update
 * @returns {Promise} - Update result
 */
const supabaseUpdate = async (table, data, match, options = {}) => {
  if (!supabaseAdmin) {
    console.error('Supabase client not initialized');
    return { data: [], error: new Error('Supabase client not initialized') };
  }
  
  let query = supabaseAdmin.from(table).update(data);
  
  Object.keys(match).forEach(key => {
    query = query.eq(key, match[key]);
  });
  
  if (options.returning) {
    query = query.select();
  }
  
  return query;
};

/**
 * Delete data from a table using Supabase
 * @param {string} table - Table name
 * @param {Object} match - Conditions to match
 * @returns {Promise} - Delete result
 */
const supabaseDelete = async (table, match) => {
  if (!supabaseAdmin) {
    console.error('Supabase client not initialized');
    return { data: [], error: new Error('Supabase client not initialized') };
  }
  
  let query = supabaseAdmin.from(table).delete();
  
  Object.keys(match).forEach(key => {
    query = query.eq(key, match[key]);
  });
  
  return query;
};

// Get Supabase client instance
const getSupabaseClient = () => supabaseAdmin;

module.exports = {
  query,
  getClient,
  pool,
  supabaseQuery,
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete,
  getSupabaseClient
};