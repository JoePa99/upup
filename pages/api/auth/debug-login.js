// Diagnostic login endpoint for troubleshooting
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Support both GET and POST
  if (req.method === 'GET') {
    // For GET requests, just return environment info
    return res.status(200).json({
      message: 'Debug login endpoint ready',
      instructions: 'Send a POST request with email and password to test login',
      environment: {
        NEXT_PUBLIC_SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY_SET: !!process.env.SUPABASE_SERVICE_KEY
      }
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Try all possible environment variable combinations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        error: 'Supabase configuration missing',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      });
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ 
        error: error.message,
        supabase_error: error
      });
    }
    
    // Only return user information, not the actual session or tokens
    res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        user_metadata: data.user.user_metadata
      },
      message: 'Debug login successful'
    });
  } catch (error) {
    console.error('Debug login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}