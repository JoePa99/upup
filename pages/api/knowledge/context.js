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

// Function to perform similarity search using embeddings
async function findRelevantKnowledge(query, tenantId, limit = 5) {
  if (!supabase) {
    return [];
  }

  try {
    // In a real implementation, we'd create embeddings for the query
    // and use pgvector similarity search
    // For now, just return most recent knowledge
    const { data, error } = await supabase
      .from('company_knowledge')
      .select('title, content, document_type')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error finding relevant knowledge:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in similarity search:', error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, contentType } = req.body;
    const user = getUserFromRequest(req);

    if (!query) {
      return res.status(400).json({
        message: 'Missing required field: query'
      });
    }

    // Get relevant company knowledge
    const relevantKnowledge = await findRelevantKnowledge(query, user.tenantId);

    // Format company context
    let companyContext = '';
    if (relevantKnowledge.length > 0) {
      companyContext = relevantKnowledge.map(item => 
        `${item.title}: ${item.content.substring(0, 500)}...`
      ).join('\n\n');
    }

    // Get tenant-specific information
    const tenantInfo = {
      companyName: user.tenantName,
      industry: 'Professional Services', // Would come from tenant profile
      size: 'Medium Business', // Would come from tenant profile
      values: 'Quality, Innovation, Customer Success' // Would come from tenant profile
    };

    return res.status(200).json({
      success: true,
      data: {
        tenantInfo,
        companyContext,
        relevantKnowledge: relevantKnowledge.map(item => ({
          title: item.title,
          type: item.document_type,
          excerpt: item.content.substring(0, 200) + '...'
        })),
        contextLength: companyContext.length
      }
    });

  } catch (error) {
    console.error('Context retrieval error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve company context',
      error: error.message
    });
  }
}