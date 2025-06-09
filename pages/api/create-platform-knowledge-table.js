import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Create the platform_knowledge table using raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS platform_knowledge (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            document_type VARCHAR(50) NOT NULL DEFAULT 'best_practices',
            category VARCHAR(100) DEFAULT 'General',
            tags TEXT[],
            status VARCHAR(20) DEFAULT 'active',
            created_by_super_admin VARCHAR(255),
            version INTEGER DEFAULT 1,
            usage_count INTEGER DEFAULT 0,
            metadata JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_platform_knowledge_category ON platform_knowledge(category);
          CREATE INDEX IF NOT EXISTS idx_platform_knowledge_status ON platform_knowledge(status);
          CREATE INDEX IF NOT EXISTS idx_platform_knowledge_document_type ON platform_knowledge(document_type);
          CREATE INDEX IF NOT EXISTS idx_platform_knowledge_created_at ON platform_knowledge(created_at);
        `
      });

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Platform knowledge table created successfully'
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