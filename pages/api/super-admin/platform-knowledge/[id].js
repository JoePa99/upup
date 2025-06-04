import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    return deletePlatformKnowledge(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function deletePlatformKnowledge(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: 'Platform knowledge ID is required'
      });
    }

    // Delete the platform knowledge entry
    const { error } = await supabase
      .from('platform_knowledge')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting platform knowledge:', error);
      return res.status(500).json({
        message: 'Failed to delete platform knowledge',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Platform knowledge deleted successfully'
    });

  } catch (error) {
    console.error('Super admin delete platform knowledge error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}