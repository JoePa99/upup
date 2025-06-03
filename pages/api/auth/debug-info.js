// Simple diagnostic endpoint that works with GET requests
export default function handler(req, res) {
  // Get environment info (without exposing secrets)
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL === '1',
    VERCEL_ENV: process.env.VERCEL_ENV,
    
    // Environment variables needed for Supabase
    NEXT_PUBLIC_SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY_SET: !!process.env.SUPABASE_SERVICE_KEY,
    
    // Other important environment variables
    OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY_SET: !!process.env.ANTHROPIC_API_KEY,
  };
  
  // Return debug info
  res.status(200).json({
    success: true,
    message: 'Debug information',
    environment: envInfo,
    request: {
      method: req.method,
      path: req.url,
      headers: req.headers
    },
    timestamp: new Date().toISOString()
  });
}