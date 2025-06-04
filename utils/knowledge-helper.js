// Helper function to get company context for content generation
async function getCompanyContext(query, req) {
  try {
    // Import auth helpers
    const { getUserFromRequest } = require('./auth-helpers');
    const user = await getUserFromRequest(req);
    
    if (!user || !user.tenantId) {
      console.log('No authenticated user found, using fallback context');
      return {
        tenantInfo: {
          companyName: 'Your Company',
          industry: 'Professional Services',
          size: 'Medium Business',
          values: 'Quality, Innovation, Customer Success'
        },
        companyContext: '',
        relevantKnowledge: []
      };
    }

    // Call the knowledge API directly to get company knowledge
    const knowledgeUrl = `${req.headers.origin || 'http://localhost:3000'}/api/knowledge/company`;
    const knowledgeResponse = await fetch(knowledgeUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json'
      }
    });
    
    let relevantKnowledge = [];
    let companyContext = '';
    
    if (knowledgeResponse.ok) {
      const knowledgeData = await knowledgeResponse.json();
      const knowledge = knowledgeData.data?.knowledge || [];
      
      // Filter knowledge relevant to the query
      relevantKnowledge = knowledge.filter(item => {
        const searchText = `${item.title} ${item.content || ''}`.toLowerCase();
        const queryLower = query.toLowerCase();
        return searchText.includes(queryLower) || 
               queryLower.split(' ').some(word => searchText.includes(word));
      }).slice(0, 3); // Limit to top 3 relevant items
      
      // Create context string from relevant knowledge
      companyContext = relevantKnowledge.map(item => 
        `${item.title}: ${(item.content || '').substring(0, 300)}...`
      ).join('\n\n');
    }

    return {
      tenantInfo: {
        companyName: user.tenantName || 'Your Company',
        industry: 'Professional Services', // Could be enhanced to get from tenant data
        size: 'Medium Business',
        values: 'Quality, Innovation, Customer Success'
      },
      companyContext,
      relevantKnowledge: relevantKnowledge.map(item => ({
        title: item.title,
        excerpt: (item.content || '').substring(0, 150) + '...'
      }))
    };
  } catch (error) {
    console.error('Error getting company context:', error);
    // Fallback to basic context
    return {
      tenantInfo: {
        companyName: 'Your Company',
        industry: 'Professional Services',
        size: 'Medium Business',
        values: 'Quality, Innovation, Customer Success'
      },
      companyContext: '',
      relevantKnowledge: []
    };
  }
}

module.exports = {
  getCompanyContext
};