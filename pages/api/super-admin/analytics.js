export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Mock analytics data for now
    // In production, this would query the database for real metrics
    const analytics = {
      totalTenants: 12,
      totalUsers: 156,
      totalKnowledgeDocs: 89,
      monthlyRevenue: 2850,
      platformUsage: [
        { date: '2024-01-01', users: 120, generations: 450 },
        { date: '2024-01-02', users: 135, generations: 520 },
        { date: '2024-01-03', users: 142, generations: 600 },
      ],
      topCategories: [
        { category: 'Sales', usage: 45 },
        { category: 'HR', usage: 32 },
        { category: 'Legal', usage: 28 },
        { category: 'Marketing', usage: 25 }
      ],
      recentActivity: [
        {
          type: 'company_registered',
          company: 'Acme Corp',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: 'New company registration'
        },
        {
          type: 'knowledge_updated',
          category: 'Legal',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          details: 'Platform knowledge base updated'
        },
        {
          type: 'user_milestone',
          count: 50,
          timestamp: new Date().toISOString(),
          details: 'New users registered today'
        }
      ]
    };

    return res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
}