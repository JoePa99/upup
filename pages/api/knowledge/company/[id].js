import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Helper function to get user info from request
function getUserFromRequest(req) {
  // In a real implementation, decode JWT token
  // For demo, return mock user info
  return {
    id: 1,
    tenantId: 1,
    tenantName: 'Demo Company',
    email: 'demo@company.com'
  };
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    // Handle knowledge deletion
    try {
      const user = getUserFromRequest(req);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameter: id'
        });
      }

      // Delete from Supabase if available
      let deleted = false;
      if (supabase) {
        try {
          const { error } = await supabase
            .from('company_knowledge')
            .delete()
            .eq('id', id)
            .eq('tenant_id', user.tenantId);

          if (error) {
            console.error('Supabase delete error:', error);
          } else {
            deleted = true;
          }
        } catch (error) {
          console.error('Error deleting from Supabase:', error);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Knowledge item deleted successfully',
        deleted_from_supabase: deleted
      });

    } catch (error) {
      console.error('Knowledge deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete knowledge item',
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    // Handle getting specific knowledge item
    try {
      const user = getUserFromRequest(req);

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('company_knowledge')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', user.tenantId)
            .single();

          if (error) {
            console.error('Supabase query error:', error);
            return res.status(404).json({
              success: false,
              message: 'Knowledge item not found'
            });
          }

          return res.status(200).json({
            success: true,
            data: data
          });
        } catch (error) {
          console.error('Error retrieving from Supabase:', error);
        }
      }

      // Fallback for mock data
      return res.status(404).json({
        success: false,
        message: 'Knowledge item not found'
      });

    } catch (error) {
      console.error('Knowledge retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve knowledge item',
        error: error.message
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}