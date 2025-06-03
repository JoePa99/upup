// Test endpoint for Supabase connection
import { createClient } from '@supabase/supabase-js';

export default function handler(req, res) {
  // Try to initialize Supabase client with both naming conventions
  const results = {
    env_vars_found: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    client_creation_attempts: []
  };
  
  // Attempt 1: Using SUPABASE_URL and SUPABASE_SERVICE_KEY
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const supabase1 = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      
      results.client_creation_attempts.push({
        attempt: 'SUPABASE_URL + SUPABASE_SERVICE_KEY',
        success: !!supabase1,
        client_type: typeof supabase1
      });
    } else {
      results.client_creation_attempts.push({
        attempt: 'SUPABASE_URL + SUPABASE_SERVICE_KEY',
        success: false,
        reason: 'Missing environment variables'
      });
    }
  } catch (error) {
    results.client_creation_attempts.push({
      attempt: 'SUPABASE_URL + SUPABASE_SERVICE_KEY',
      success: false,
      error: error.message
    });
  }
  
  // Attempt 2: Using NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const supabase2 = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      
      results.client_creation_attempts.push({
        attempt: 'NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY',
        success: !!supabase2,
        client_type: typeof supabase2
      });
    } else {
      results.client_creation_attempts.push({
        attempt: 'NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY',
        success: false,
        reason: 'Missing environment variables'
      });
    }
  } catch (error) {
    results.client_creation_attempts.push({
      attempt: 'NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY',
      success: false,
      error: error.message
    });
  }
  
  // Attempt 3: Using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase3 = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      results.client_creation_attempts.push({
        attempt: 'NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY',
        success: !!supabase3,
        client_type: typeof supabase3
      });
    } else {
      results.client_creation_attempts.push({
        attempt: 'NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY',
        success: false,
        reason: 'Missing environment variables'
      });
    }
  } catch (error) {
    results.client_creation_attempts.push({
      attempt: 'NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY',
      success: false,
      error: error.message
    });
  }
  
  // Check auth-helpers.js import
  try {
    const { supabaseAdmin } = require('../../utils/auth-helpers');
    results.supabaseAdmin_import = {
      success: !!supabaseAdmin,
      type: typeof supabaseAdmin
    };
  } catch (error) {
    results.supabaseAdmin_import = {
      success: false,
      error: error.message
    };
  }
  
  res.status(200).json({
    success: true,
    message: 'Supabase connection test',
    results,
    timestamp: new Date().toISOString()
  });
}