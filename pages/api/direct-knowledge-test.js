// Direct knowledge test endpoint that bypasses normal flow
import { supabaseAdmin } from '../../utils/auth-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { title, content, tenant_id } = req.body;
    
    if (!title || !content || !tenant_id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'content', 'tenant_id']
      });
    }
    
    // Directly insert without RLS (as service role)
    const { data, error } = await supabaseAdmin
      .from('company_knowledge')
      .insert({
        title,
        content,
        tenant_id,
        document_type: 'general',
        file_size_kb: Math.round(content.length / 10),
        knowledge_level: 'company'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error
      });
    }
    
    // Now try to read it back
    const { data: readData, error: readError } = await supabaseAdmin
      .from('company_knowledge')
      .select()
      .eq('id', data.id)
      .single();
    
    return res.status(200).json({
      success: true,
      inserted: data,
      read_back: readData,
      read_error: readError,
      message: 'Direct knowledge test completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direct knowledge test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}