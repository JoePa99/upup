import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('Test user create endpoint accessed:', req.method, req.url);
  
  if (req.method === 'POST') {
    console.log('POST request received with body:', req.body);
    
    try {
      const { email, name, companyId, role = 'user' } = req.body;

      if (!email || !name || !companyId) {
        return res.status(400).json({
          message: 'Email, name, and company are required'
        });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({
          message: 'User with this email already exists'
        });
      }

      // Verify company exists
      const { data: company, error: companyError } = await supabase
        .from('tenants')
        .select('id, company_name')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        return res.status(400).json({
          message: 'Invalid company ID'
        });
      }

      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            name,
            tenant_id: companyId,
            role,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
          message: 'Failed to create user',
          error: error.message
        });
      }

      console.log('User created successfully:', newUser);

      return res.status(201).json({
        success: true,
        data: {
          ...newUser,
          company_name: company.company_name
        }
      });

    } catch (error) {
      console.error('Error in user creation:', error);
      return res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  return res.status(200).json({ 
    success: true, 
    message: 'Test endpoint accessible',
    method: req.method 
  });
}