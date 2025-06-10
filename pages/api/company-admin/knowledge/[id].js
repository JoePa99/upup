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
  const { id: knowledgeId } = req.query;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    switch (req.method) {
      case 'DELETE':
        // Delete knowledge item (only items in the same tenant)
        
        // First verify the knowledge item exists and belongs to the same tenant
        const { data: knowledgeToDelete, error: fetchError } = await supabase
          .from('knowledge_base')
          .select('id, tenant_id, title')
          .eq('id', knowledgeId)
          .eq('tenant_id', user.tenant_id)
          .single();

        if (fetchError || !knowledgeToDelete) {
          return res.status(404).json({
            success: false,
            message: 'Knowledge item not found or access denied'
          });
        }

        // Delete knowledge item
        const { error: deleteError } = await supabase
          .from('knowledge_base')
          .delete()
          .eq('id', knowledgeId)
          .eq('tenant_id', user.tenant_id);

        if (deleteError) {
          console.error('Error deleting knowledge:', deleteError);
          return res.status(500).json({
            success: false,
            message: 'Failed to delete knowledge item',
            error: deleteError.message
          });
        }

        return res.status(200).json({
          success: true,
          message: `Knowledge item "${knowledgeToDelete.title}" deleted successfully`
        });

      case 'PUT':
        // Update knowledge item metadata
        const { title, category } = req.body;

        // First verify the knowledge item exists and belongs to the same tenant
        const { data: existingKnowledge, error: fetchUpdateError } = await supabase
          .from('knowledge_base')
          .select('id, tenant_id')
          .eq('id', knowledgeId)
          .eq('tenant_id', user.tenant_id)
          .single();

        if (fetchUpdateError || !existingKnowledge) {
          return res.status(404).json({
            success: false,
            message: 'Knowledge item not found or access denied'
          });
        }

        // Update knowledge item
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (category !== undefined) updateData.category = category;

        const { data: updatedKnowledge, error: updateError } = await supabase
          .from('knowledge_base')
          .update(updateData)
          .eq('id', knowledgeId)
          .eq('tenant_id', user.tenant_id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating knowledge:', updateError);
          return res.status(500).json({
            success: false,
            message: 'Failed to update knowledge item',
            error: updateError.message
          });
        }

        return res.status(200).json({
          success: true,
          data: updatedKnowledge,
          message: 'Knowledge item updated successfully'
        });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Company admin knowledge management API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

export default handler;