const { Pool } = require('pg');
const dotenv = require('dotenv');
const { supabaseAdmin } = require('./supabase');

dotenv.config();

// Create connection pool using DATABASE_URL or individual parameters
const pool = new Pool({
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
  process.exit(-1);
});

/**
 * Execute a database query via direct SQL
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
const query = async (text, params) => {
  return pool.query(text, params);
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
  let query = supabaseAdmin.from(table).delete();
  
  Object.keys(match).forEach(key => {
    query = query.eq(key, match[key]);
  });
  
  return query;
};

module.exports = {
  query,
  getClient: () => pool.connect(),
  pool,
  supabaseQuery,
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete
};