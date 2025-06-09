import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('Test user create endpoint accessed:', req.method, req.url);
  
  // Auth bypass for development/testing - same pattern as knowledge API
  // In production, you would verify super admin status here
  
  if (req.method === 'POST') {
    console.log('POST request received with body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Debug: Return the received data for troubleshooting
    return res.status(200).json({
      success: true,
      debug: true,
      received: {
        body: req.body,
        headers: {
          contentType: req.headers['content-type'],
          authorization: req.headers.authorization ? 'present' : 'missing'
        }
      }
    });
    
    try {
      const { email, name, companyId, role = 'user' } = req.body;

      if (!email || !name || !companyId) {
        console.log('Validation failed:', { email, name, companyId, role });
        return res.status(400).json({
          message: 'Email, name, and company are required',
          received: { email, name, companyId, role },
          missing: {
            email: !email,
            name: !name,
            companyId: !companyId
          }
        });
      }

      // Check if user already exists
      console.log('Checking for existing user with email:', email);
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      console.log('User check result:', { existingUser, userCheckError });

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('Error checking existing user:', userCheckError);
        return res.status(500).json({
          message: 'Error checking existing user',
          error: userCheckError.message
        });
      }

      if (existingUser) {
        console.log('User already exists');
        return res.status(400).json({
          message: 'User with this email already exists'
        });
      }

      // Verify company exists - simplified query to avoid column issues
      console.log('Checking for company with ID:', companyId);
      const { data: company, error: companyError } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', companyId)
        .single();

      console.log('Company check result:', { company, companyError });

      if (companyError) {
        console.error('Error checking company:', companyError);
        return res.status(400).json({
          message: 'Error checking company',
          error: companyError.message
        });
      }

      if (!company) {
        console.log('Company not found');
        return res.status(400).json({
          message: 'Company not found with the provided ID'
        });
      }

      // Create new user
      console.log('Creating user with data:', { email, name, tenant_id: companyId, role });
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

      console.log('User creation result:', { newUser, error });

      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
          message: 'Failed to create user',
          error: error.message,
          details: error
        });
      }

      console.log('User created successfully:', newUser);

      return res.status(201).json({
        success: true,
        data: newUser
      });

    } catch (error) {
      console.error('Error in user creation:', error);
      return res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Method not allowed
  res.setHeader('Allow', ['POST']);
  return res.status(405).json({
    message: 'Method not allowed',
    method: req.method
  });
}