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
      
      console.log(`Knowledge retrieval: Found ${knowledge.length} knowledge items for query: "${query}"`);
      
      // Filter knowledge relevant to the query
      relevantKnowledge = knowledge.filter(item => {
        const searchText = `${item.title} ${item.content || ''}`.toLowerCase();
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ').filter(word => word.length > 2); // Only words longer than 2 chars
        
        // Check if any query word appears in the knowledge
        const isRelevant = queryWords.some(word => searchText.includes(word));
        
        if (isRelevant) {
          console.log(`Knowledge match found: "${item.title}" matches query "${query}"`);
        }
        
        return isRelevant;
      }).slice(0, 3); // Limit to top 3 relevant items
      
      // If no specific matches found, include all knowledge for general context (limit to 2 items)
      if (relevantKnowledge.length === 0 && knowledge.length > 0) {
        console.log('No specific knowledge matches found, including general knowledge');
        relevantKnowledge = knowledge.slice(0, 2);
      }
      
      // Create context string from relevant knowledge
      companyContext = relevantKnowledge.map(item => 
        `${item.title}: ${(item.content || '').substring(0, 400)}...`
      ).join('\n\n');
      
      console.log(`Final knowledge context length: ${companyContext.length} characters`);
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