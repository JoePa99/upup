import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Test the exact same queries that the frontend uses

      // 1. Test company knowledge loading (same as knowledge-bases.js)
      const { data: companyKnowledge, error: companyError } = await supabase
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

      // 2. Test platform knowledge loading
      let platformKnowledge = null;
      let platformError = null;
      
      try {
        const result = await supabase
          .from('platform_knowledge')
          .select('*')
          .order('created_at', { ascending: false });
        platformKnowledge = result.data;
        platformError = result.error;
      } catch (e) {
        platformError = { message: e.message };
      }

      // 3. Format company knowledge like the frontend expects
      const formattedCompanyKnowledge = companyKnowledge?.map(kb => ({
        id: kb.id,
        filename: kb.title,
        file_size: (kb.content?.length || 0), 
        content_type: kb.document_type,
        tenant_id: kb.tenant_id,
        company_name: kb.tenants?.name || 'Unknown Company',
        uploaded_at: kb.created_at
      })) || [];

      return res.status(200).json({
        success: true,
        company_knowledge: {
          raw: companyKnowledge,
          formatted: formattedCompanyKnowledge,
          count: companyKnowledge?.length || 0,
          error: companyError?.message || null
        },
        platform_knowledge: {
          data: platformKnowledge,
          count: platformKnowledge?.length || 0,
          error: platformError?.message || null
        },
        // Simulate the actual API responses the frontend gets
        knowledge_bases_response: {
          success: true,
          data: formattedCompanyKnowledge
        },
        platform_knowledge_response: {
          success: true,
          data: platformKnowledge || []
        }
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