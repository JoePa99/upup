// Debug authentication and user context
import { getUserFromRequest } from '../../utils/auth-helpers';

export default async function handler(req, res) {
  try {
    console.log('=== AUTH DEBUG ===');
    console.log('Authorization header:', req.headers.authorization);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Try to get user from request
    const user = await getUserFromRequest(req);
    console.log('User result:', user);
    
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    console.log('Environment variables:', envCheck);
    
    res.status(200).json({
      success: true,
      debug: {
        user: user,
        hasAuthHeader: !!req.headers.authorization,
        authHeaderFormat: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : null,
        environmentVariables: envCheck,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Auth debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}