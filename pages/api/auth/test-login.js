import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Create a fresh supabase client (like the frontend does)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('Starting login test for:', email);

    // Step 1: Try to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({
        step: 'auth_signin',
        error: authError.message,
        success: false
      });
    }

    console.log('Auth signin successful, user:', authData.user?.id);

    // Step 2: Try the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_user_tenant_info');

    console.log('RPC result:', { data: rpcData, error: rpcError?.message });

    // Step 3: Try direct query
    const { data: directData, error: directError } = await supabase
      .from('users')
      .select(`
        id,
        tenant_id,
        role,
        email,
        first_name,
        last_name,
        tenants!inner (
          id,
          name,
          subdomain
        )
      `)
      .eq('auth_user_id', authData.user.id)
      .single();

    console.log('Direct query result:', { data: directData, error: directError?.message });

    // Step 4: Get session info
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session data:', { 
      hasSession: !!sessionData.session,
      user: sessionData.session?.user?.id,
      error: sessionError?.message 
    });

    res.status(200).json({
      success: true,
      steps: {
        auth_signin: {
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email
          }
        },
        rpc_function: {
          success: !rpcError,
          data: rpcData,
          error: rpcError?.message
        },
        direct_query: {
          success: !directError,
          data: directData,
          error: directError?.message
        },
        session: {
          success: !sessionError,
          hasSession: !!sessionData.session,
          error: sessionError?.message
        }
      }
    });

  } catch (error) {
    console.error('Test login API error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Test failed'
    });
  }
}