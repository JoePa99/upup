import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getCompanies(req, res);
  } else if (req.method === 'POST') {
    return createCompany(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getCompanies(req, res) {
  try {
    // Get all companies with basic info
    const { data: companies, error } = await supabase
      .from('tenants')
      .select(`
        id,
        company_name,
        domain,
        industry,
        created_at,
        subscription_plan,
        status
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch companies',
        error: error.message 
      });
    }

    // Get user counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', company.id);

        return {
          ...company,
          user_count: count || 0,
          name: company.company_name,
          subscription_plan: company.subscription_plan || 'free',
          status: company.status || 'active'
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: companiesWithCounts
    });

  } catch (error) {
    console.error('Super admin companies error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function createCompany(req, res) {
  try {
    const { name, domain, industry } = req.body;

    if (!name || !domain) {
      return res.status(400).json({
        message: 'Company name and domain are required'
      });
    }

    // Check if domain already exists
    const { data: existingCompany } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existingCompany) {
      return res.status(400).json({
        message: 'Domain already exists'
      });
    }

    // Create new company
    const { data: newCompany, error } = await supabase
      .from('tenants')
      .insert([
        {
          company_name: name,
          domain: domain,
          industry: industry || null,
          subscription_plan: 'free',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return res.status(500).json({
        message: 'Failed to create company',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        ...newCompany,
        name: newCompany.company_name,
        user_count: 0
      }
    });

  } catch (error) {
    console.error('Super admin create company error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}