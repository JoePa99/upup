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
    } else if (req.method === 'PUT') {
      return updateCompany(req, res);
    } else if (req.method === 'DELETE') {
      return deleteCompany(req, res);
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
        name,
        subdomain,
        admin_email,
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
          company_name: company.name,
          domain: company.subdomain,
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

    // Check if subdomain already exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', domain)
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
          name: name,
          subdomain: domain,
          admin_email: 'admin@' + domain + '.com',
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

async function updateCompany(req, res) {
  try {
    console.log('Updating company with data:', req.body);
    
    const { id, name, domain, industry } = req.body;

    if (!id) {
      return res.status(400).json({
        message: 'Company ID is required'
      });
    }

    if (!name || !domain) {
      console.log('Missing required fields:', { name, domain });
      return res.status(400).json({
        message: 'Company name and domain are required'
      });
    }

    // Check if company exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingCompany) {
      console.error('Company not found:', checkError);
      return res.status(404).json({
        message: 'Company not found'
      });
    }

    // Check if domain already exists for another company
    const { data: domainCheck, error: domainError } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', domain)
      .neq('id', id)
      .single();

    if (domainError && domainError.code !== 'PGRST116') {
      console.error('Error checking domain:', domainError);
      return res.status(500).json({
        message: 'Error checking domain availability',
        error: domainError.message
      });
    }

    if (domainCheck) {
      return res.status(400).json({
        message: 'Domain already exists for another company'
      });
    }

    // Update company
    const { data: updatedCompany, error } = await supabase
      .from('tenants')
      .update({
        company_name: name,
        domain: domain,
        industry: industry || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        company_name,
        domain,
        industry,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return res.status(500).json({
        message: 'Failed to update company',
        error: error.message
      });
    }

    console.log('Company updated successfully:', updatedCompany);

    return res.status(200).json({
      success: true,
      data: {
        id: updatedCompany.id,
        name: updatedCompany.company_name,
        domain: updatedCompany.domain,
        industry: updatedCompany.industry,
        created_at: updatedCompany.created_at,
        updated_at: updatedCompany.updated_at
      }
    });

  } catch (error) {
    console.error('Super admin update company error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function deleteCompany(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: 'Company ID is required'
      });
    }

    console.log('Deleting company with ID:', id);

    // Check if company exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('tenants')
      .select('id, company_name')
      .eq('id', id)
      .single();

    if (checkError || !existingCompany) {
      console.error('Company not found:', checkError);
      return res.status(404).json({
        message: 'Company not found'
      });
    }

    // Check if company has users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', id)
      .limit(1);

    if (usersError) {
      console.error('Error checking users:', usersError);
      return res.status(500).json({
        message: 'Error checking company users',
        error: usersError.message
      });
    }

    if (users && users.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete company with existing users. Please delete all users first.'
      });
    }

    // Delete company
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      return res.status(500).json({
        message: 'Failed to delete company',
        error: error.message
      });
    }

    console.log('Company deleted successfully:', existingCompany.company_name);

    return res.status(200).json({
      success: true,
      message: `Company "${existingCompany.company_name}" deleted successfully`
    });

  } catch (error) {
    console.error('Super admin delete company error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}