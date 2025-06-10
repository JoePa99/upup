// Helper function to verify company admin auth
async function requireCompanyAdminAuth(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No authorization token provided' });
      return false;
    }

    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const isCompanyAdmin = decoded.role === 'company_admin' || decoded.role === 'admin';
    if (!isCompanyAdmin) {
      res.status(403).json({ success: false, message: 'Company admin access required' });
      return false;
    }

    req.user = decoded;
    return true;
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return false;
  }
}

async function handler(req, res) {
  // Only allow company admins and above
  const authResult = await requireCompanyAdminAuth(req, res);
  if (!authResult) return;

  const { user } = req;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (req.method === 'GET') {
      // Get analytics for the company admin's tenant
      
      // Get user statistics
      const { data: userStats, error: userStatsError } = await supabase
        .from('users')
        .select('id, role, status, created_at')
        .eq('tenant_id', user.tenant_id);

      if (userStatsError) {
        console.error('Error fetching user stats:', userStatsError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch user statistics',
          error: userStatsError.message 
        });
      }

      // Get knowledge base statistics
      const { data: knowledgeStats, error: knowledgeStatsError } = await supabase
        .from('knowledge_base')
        .select('id, file_size, created_at')
        .eq('tenant_id', user.tenant_id);

      if (knowledgeStatsError) {
        console.error('Error fetching knowledge stats:', knowledgeStatsError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch knowledge statistics',
          error: knowledgeStatsError.message 
        });
      }

      // Get usage statistics (if usage tracking table exists)
      let usageStats = [];
      try {
        const { data: usage, error: usageError } = await supabase
          .from('usage_tracking')
          .select('id, action_type, created_at')
          .eq('tenant_id', user.tenant_id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (!usageError) {
          usageStats = usage || [];
        }
      } catch (usageError) {
        console.log('Usage tracking table not available or error:', usageError.message);
      }

      // Calculate statistics
      const totalUsers = userStats?.length || 0;
      const activeUsers = userStats?.filter(u => u.status === 'active').length || 0;
      const adminUsers = userStats?.filter(u => u.role === 'company_admin' || u.role === 'admin').length || 0;
      
      const knowledgeCount = knowledgeStats?.length || 0;
      const totalStorageBytes = knowledgeStats?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;
      const storageUsed = (totalStorageBytes / (1024 * 1024)).toFixed(2) + ' MB';
      
      const contentGenerated = usageStats?.filter(u => u.action_type === 'content_generated').length || 0;
      const templatesUsed = usageStats?.filter(u => u.action_type === 'template_used').length || 0;
      const aiAssists = usageStats?.filter(u => u.action_type === 'ai_assist').length || 0;

      // Get latest activity dates
      const lastUserCreated = userStats?.length > 0 ? 
        new Date(Math.max(...userStats.map(u => new Date(u.created_at)))).toLocaleDateString() : 
        'N/A';
      
      const lastKnowledgeUpload = knowledgeStats?.length > 0 ? 
        new Date(Math.max(...knowledgeStats.map(k => new Date(k.created_at)))).toLocaleDateString() : 
        'N/A';
      
      const lastActivity = usageStats?.length > 0 ? 
        new Date(Math.max(...usageStats.map(u => new Date(u.created_at)))).toLocaleDateString() : 
        'N/A';

      const analytics = {
        // User statistics
        total_users: totalUsers,
        active_users: activeUsers,
        admin_users: adminUsers,
        last_user_created: lastUserCreated,
        
        // Knowledge base statistics
        knowledge_count: knowledgeCount,
        storage_used: storageUsed,
        last_upload_date: lastKnowledgeUpload,
        
        // Usage statistics
        content_generated: contentGenerated,
        templates_used: templatesUsed,
        ai_assists: aiAssists,
        last_activity_date: lastActivity,
        
        // Company information
        company_name: user.companyName || 'Unknown',
        tenant_id: user.tenant_id
      };

      return res.status(200).json({
        success: true,
        data: analytics
      });
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Company admin analytics API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

export default handler;