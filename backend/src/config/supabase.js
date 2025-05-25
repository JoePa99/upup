const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabaseAdmin = null;
let supabaseClient = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    // Create a Supabase client with the service role key for admin access
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('Supabase Admin client initialized');
  } catch (error) {
    console.error('Failed to initialize Supabase Admin client:', error);
  }
} else {
  console.log('Supabase Admin client not initialized - missing environment variables');
}

if (supabaseUrl && supabaseAnonKey) {
  try {
    // Create a Supabase client with the anon key for public access
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase public client initialized');
  } catch (error) {
    console.error('Failed to initialize Supabase public client:', error);
  }
} else {
  console.log('Supabase public client not initialized - missing environment variables');
}

// Create a function to get a client with a user's JWT
// This is useful for tenant-specific operations with RLS policies
const getSupabaseClient = (jwt) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Cannot get Supabase client - missing environment variables');
    return null;
  }

  if (!jwt) {
    return supabaseClient;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    });
  } catch (error) {
    console.error('Error creating Supabase client with JWT:', error);
    return null;
  }
};

module.exports = {
  supabaseAdmin,
  supabaseClient,
  getSupabaseClient
};