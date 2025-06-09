import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get users table structure by trying to select all columns
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      // Also try a minimal insert to see what columns are required
      const testInsert = {
        email: 'test@example.com',
        name: 'Test User',
        tenant_id: 1,
        role: 'user'
      };

      return res.status(200).json({
        success: true,
        sample_user: users?.[0] || null,
        table_structure: users?.[0] ? Object.keys(users[0]) : [],
        test_insert_data: testInsert,
        query_error: error?.message || null
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