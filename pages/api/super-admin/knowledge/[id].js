import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    return deleteKnowledge(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function deleteKnowledge(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: 'Knowledge base ID is required'
      });
    }

    // Delete the knowledge base entry
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting knowledge:', error);
      return res.status(500).json({
        message: 'Failed to delete knowledge',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Knowledge deleted successfully'
    });

  } catch (error) {
    console.error('Super admin delete knowledge error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}