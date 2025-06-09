import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Check all knowledge-related tables
      const results = {};

      // Check company_knowledge table
      try {
        const { data: companyKnowledge, error: ckError } = await supabase
          .from('company_knowledge')
          .select('*')
          .limit(10);
        results.company_knowledge = { data: companyKnowledge, error: ckError?.message };
      } catch (e) {
        results.company_knowledge = { error: e.message };
      }

      // Check if old knowledge_base table exists
      try {
        const { data: knowledgeBase, error: kbError } = await supabase
          .from('knowledge_base')
          .select('*')
          .limit(10);
        results.knowledge_base = { data: knowledgeBase, error: kbError?.message };
      } catch (e) {
        results.knowledge_base = { error: e.message };
      }

      // Check platform_knowledge table
      try {
        const { data: platformKnowledge, error: pkError } = await supabase
          .from('platform_knowledge')
          .select('*')
          .limit(10);
        results.platform_knowledge = { data: platformKnowledge, error: pkError?.message };
      } catch (e) {
        results.platform_knowledge = { error: e.message };
      }

      return res.status(200).json({
        success: true,
        tables: results,
        summary: {
          company_knowledge_count: results.company_knowledge?.data?.length || 0,
          knowledge_base_count: results.knowledge_base?.data?.length || 0,
          platform_knowledge_count: results.platform_knowledge?.data?.length || 0
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