import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Test the exact same query that knowledge-bases.js uses
      const { data: knowledgeEntries, error } = await supabase
        .from('company_knowledge')
        .select(`
          id,
          title,
          content,
          document_type,
          category,
          tenant_id,
          created_at,
          tenants (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Also test platform knowledge
      const { data: platformEntries, error: platformError } = await supabase
        .from('platform_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      return res.status(200).json({
        success: true,
        company_knowledge: {
          data: knowledgeEntries,
          count: knowledgeEntries?.length || 0,
          error: error?.message || null
        },
        platform_knowledge: {
          data: platformEntries,
          count: platformEntries?.length || 0,
          error: platformError?.message || null
        },
        formatted_company_knowledge: knowledgeEntries?.map(kb => ({
          id: kb.id,
          filename: kb.title,
          file_size: (kb.content?.length || 0), 
          content_type: kb.document_type,
          tenant_id: kb.tenant_id,
          company_name: kb.tenants?.name || 'Unknown Company',
          uploaded_at: kb.created_at
        })) || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}