// Direct database inspection for debugging knowledge items
import { supabaseAdmin } from '../../../utils/auth-helpers';

export default async function handler(req, res) {
  // Only accessible in development or to super admin
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'Forbidden in production',
      message: 'This endpoint is only available in development mode'
    });
  }

  try {
    // Query all knowledge items directly, bypassing RLS
    const result = await supabaseAdmin.rpc('get_all_company_knowledge');
    
    return res.status(200).json({
      success: true,
      data: result.data,
      error: result.error,
      count: result.data ? result.data.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking knowledge:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}