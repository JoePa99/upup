import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getKnowledgeBases(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getKnowledgeBases(req, res) {
  try {
    // Get all knowledge base entries with company information
    const { data: knowledgeEntries, error } = await supabase
      .from('knowledge_base')
      .select(`
        id,
        filename,
        file_size,
        content_type,
        tenant_id,
        uploaded_at,
        tenants (
          company_name
        )
      `)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge bases:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch knowledge bases',
        error: error.message 
      });
    }

    // Format the data for frontend consumption
    const formattedKnowledge = knowledgeEntries.map(kb => ({
      id: kb.id,
      filename: kb.filename,
      file_size: kb.file_size,
      content_type: kb.content_type,
      tenant_id: kb.tenant_id,
      company_name: kb.tenants?.company_name || 'Unknown Company',
      uploaded_at: kb.uploaded_at
    }));

    return res.status(200).json({
      success: true,
      data: formattedKnowledge
    });

  } catch (error) {
    console.error('Super admin knowledge bases error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}