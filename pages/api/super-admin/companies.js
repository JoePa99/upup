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
    // Mock companies data for now
    // In production, this would query the tenants table with user counts
    const companies = [
      {
        id: 1,
        name: 'Acme Corporation',
        subdomain: 'acme',
        admin_email: 'admin@acme.com',
        subscription_plan: 'business',
        status: 'active',
        user_count: 25,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 2,
        name: 'TechStart Inc',
        subdomain: 'techstart',
        admin_email: 'founder@techstart.com',
        subscription_plan: 'professional',
        status: 'active',
        user_count: 8,
        created_at: '2024-01-18T09:15:00Z',
        updated_at: '2024-01-22T11:45:00Z'
      },
      {
        id: 3,
        name: 'Design Studio',
        subdomain: 'designstudio',
        admin_email: 'hello@designstudio.com',
        subscription_plan: 'free',
        status: 'active',
        user_count: 3,
        created_at: '2024-01-20T16:20:00Z',
        updated_at: '2024-01-20T16:20:00Z'
      },
      {
        id: 4,
        name: 'Global Consulting',
        subdomain: 'globalconsult',
        admin_email: 'admin@globalconsult.com',
        subscription_plan: 'business',
        status: 'suspended',
        user_count: 45,
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-25T13:15:00Z'
      }
    ];

    return res.status(200).json({
      success: true,
      data: companies,
      total: companies.length
    });

  } catch (error) {
    console.error('Companies fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
}

async function createCompany(req, res) {
  try {
    const { name, subdomain, adminEmail, subscriptionPlan = 'free' } = req.body;

    if (!name || !subdomain || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, subdomain, adminEmail'
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.'
      });
    }

    // In production, this would:
    // 1. Check if subdomain is available
    // 2. Create tenant in database
    // 3. Send invitation email to admin
    // 4. Set up initial company structure

    const newCompany = {
      id: Date.now(), // Mock ID
      name,
      subdomain,
      admin_email: adminEmail,
      subscription_plan: subscriptionPlan,
      status: 'active',
      user_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      data: newCompany,
      message: 'Company created successfully'
    });

  } catch (error) {
    console.error('Company creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    });
  }
}