const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

// Create a Supabase client with the service role key for admin access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a function to get a client with a user's JWT
// This is useful for tenant-specific operations with RLS policies
const getSupabaseClient = (jwt) => {
  if (!jwt) {
    return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
  }
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  });
};

module.exports = {
  supabaseAdmin,
  getSupabaseClient
};