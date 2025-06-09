import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get all companies
      const { data: companies, error } = await supabase
        .from('tenants')
        .select('id, name, subdomain, admin_email, created_at')
        .order('created_at', { ascending: false });

      return res.status(200).json({
        success: true,
        companies: companies || [],
        count: companies?.length || 0,
        error: error?.message || null
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    try {
      // Create a test company
      const { data: newCompany, error } = await supabase
        .from('tenants')
        .insert([
          {
            name: 'Test Company',
            subdomain: 'test-company',
            admin_email: 'admin@testcompany.com',
            status: 'active',
            subscription_plan: 'free'
          }
        ])
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(201).json({
        success: true,
        company: newCompany
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