import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('Create user endpoint accessed:', req.method);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ message: 'Only POST method allowed', method: req.method });
  }

  try {
    console.log('Creating user with data:', req.body);
    
    const { email, name, companyId, role = 'user' } = req.body;

    if (!email || !name || !companyId) {
      console.log('Missing required fields:', { email: !!email, name: !!name, companyId: !!companyId });
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
    console.error('Super admin create user error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}