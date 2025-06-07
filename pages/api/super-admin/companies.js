import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // For now, we'll skip authentication to test functionality
    // In production, you would verify super admin status here
    console.log('Super admin companies endpoint accessed');
    
    if (req.method === 'GET') {
      return getCompanies(req, res);
    } else if (req.method === 'POST') {
      return createCompany(req, res);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Super admin companies handler error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

async function getCompanies(req, res) {
  try {
    console.log('Fetching companies from database...');
    
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

    console.log('Companies query result:', { companies: companies?.length, error });

    if (error) {
      console.error('Error fetching companies:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch companies',
        error: error.message 
      });
    }

    if (!companies || companies.length === 0) {
      console.log('No companies found, returning empty array');
      return res.status(200).json({
        success: true,
        data: []
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

    console.log('Returning companies with counts:', companiesWithCounts.length);

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
    console.log('Creating company with data:', req.body);
    
    const { name, domain, industry } = req.body;

    if (!name || !domain) {
      console.log('Missing required fields:', { name, domain });
      return res.status(400).json({
        message: 'Company name and domain are required'
      });
    }

    console.log('Checking if domain exists:', domain);

    // Check if domain already exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', domain)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is what we want
      console.error('Error checking existing domain:', checkError);
      return res.status(500).json({
        message: 'Error checking domain availability',
        error: checkError.message
      });
    }

    if (existingCompany) {
      console.log('Domain already exists:', existingCompany);
      return res.status(400).json({
        message: 'Domain already exists'
      });
    }

    console.log('Creating new company...');

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

    console.log('Company created successfully:', newCompany);

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