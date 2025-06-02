export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getPlatformKnowledge(req, res);
  } else if (req.method === 'POST') {
    return createPlatformKnowledge(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPlatformKnowledge(req, res) {
  try {
    // Mock platform knowledge data for now
    // In production, this would query the platform_knowledge table
    const platformKnowledge = [
      {
        id: 1,
        title: 'HR Compliance Guidelines',
        category: 'HR',
        document_type: 'compliance',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        usage_count: 45
      },
      {
        id: 2,
        title: 'Sales Process Best Practices',
        category: 'Sales',
        document_type: 'best_practices',
        status: 'active',
        created_at: '2024-01-18T09:15:00Z',
        updated_at: '2024-01-22T11:45:00Z',
        usage_count: 32
      },
      {
        id: 3,
        title: 'Legal Document Templates',
        category: 'Legal',
        document_type: 'templates',
        status: 'active',
        created_at: '2024-01-20T16:20:00Z',
        updated_at: '2024-01-20T16:20:00Z',
        usage_count: 28
      },
      {
        id: 4,
        title: 'Industry Standards: Data Privacy',
        category: 'General',
        document_type: 'industry_standards',
        status: 'active',
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-25T13:15:00Z',
        usage_count: 67
      },
      {
        id: 5,
        title: 'Marketing Campaign Guidelines',
        category: 'Marketing',
        document_type: 'best_practices',
        status: 'active',
        created_at: '2024-01-12T14:00:00Z',
        updated_at: '2024-01-23T09:30:00Z',
        usage_count: 19
      }
    ];

    // Group by category for statistics
    const categoryStats = platformKnowledge.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: platformKnowledge,
      stats: {
        total: platformKnowledge.length,
        by_category: categoryStats,
        total_usage: platformKnowledge.reduce((sum, doc) => sum + doc.usage_count, 0)
      }
    });

  } catch (error) {
    console.error('Platform knowledge fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch platform knowledge',
      error: error.message
    });
  }
}

async function createPlatformKnowledge(req, res) {
  try {
    const { 
      title, 
      content, 
      category, 
      document_type, 
      tags = [],
      status = 'active' 
    } = req.body;

    if (!title || !content || !category || !document_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content, category, document_type'
      });
    }

    // Validate document_type
    const validTypes = ['industry_standards', 'compliance', 'best_practices', 'templates'];
    if (!validTypes.includes(document_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid document_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate category
    const validCategories = ['HR', 'Legal', 'Sales', 'Marketing', 'General', 'Finance', 'Operations'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // In production, this would:
    // 1. Insert into platform_knowledge table
    // 2. Process content for search indexing
    // 3. Update knowledge search vectors
    // 4. Notify relevant systems

    const newKnowledge = {
      id: Date.now(), // Mock ID
      title,
      content,
      category,
      document_type,
      tags: Array.isArray(tags) ? tags : [],
      status,
      created_by_super_admin: 'admin@upup.ai', // Would come from auth
      version: 1,
      metadata: {
        created_via: 'super_admin_dashboard',
        content_length: content.length
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: 0
    };

    return res.status(201).json({
      success: true,
      data: newKnowledge,
      message: 'Platform knowledge created successfully'
    });

  } catch (error) {
    console.error('Platform knowledge creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create platform knowledge',
      error: error.message
    });
  }
}