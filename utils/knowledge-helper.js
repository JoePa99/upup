// Helper function to get company context for content generation
async function getCompanyContext(query, req) {
  try {
    // Import auth helpers
    const { getUserFromRequest } = await import('./auth-helpers.js');
    const user = await getUserFromRequest(req);
    
    if (!user || !user.tenant_id) {
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

    // Get both company-specific and platform-wide knowledge
    const [companyKnowledge, platformKnowledge] = await Promise.all([
      // Company-specific knowledge
      fetch(`${req.headers.origin || 'http://localhost:3000'}/api/knowledge/company`, {
        method: 'GET',
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json'
        }
      }),
      // Platform-wide knowledge
      fetch(`${req.headers.origin || 'http://localhost:3000'}/api/super-admin/platform-knowledge`, {
        method: 'GET',
        headers: {
          'Authorization': req.headers.authorization || '',
          'Content-Type': 'application/json'
        }
      })
    ]);
    
    let relevantKnowledge = [];
    let companyContext = '';
    
    // Process company knowledge
    let companyKnowledgeData = [];
    if (companyKnowledge.ok) {
      const knowledgeData = await companyKnowledge.json();
      companyKnowledgeData = knowledgeData.data?.knowledge || [];
      console.log(`Company knowledge: Found ${companyKnowledgeData.length} items`);
      console.log('Company knowledge sample:', companyKnowledgeData.slice(0, 1).map(item => ({
        title: item.title,
        contentLength: item.content?.length || 0,
        contentPreview: item.content?.substring(0, 100) || 'No content'
      })));
    } else {
      console.log('Company knowledge fetch failed:', companyKnowledge.status, companyKnowledge.statusText);
    }
    
    // Process platform knowledge
    let platformKnowledgeData = [];
    if (platformKnowledge.ok) {
      const platformData = await platformKnowledge.json();
      platformKnowledgeData = (platformData.data || []).map(item => ({
        title: item.title || item.filename,
        content: item.content || '',
        category: item.category || 'General',
        type: 'platform'
      }));
      console.log(`Platform knowledge: Found ${platformKnowledgeData.length} items`);
    }
    
    // Combine all knowledge
    const allKnowledge = [
      ...companyKnowledgeData.map(item => ({ ...item, type: 'company' })),
      ...platformKnowledgeData
    ];
    
    console.log(`Total knowledge: Found ${allKnowledge.length} items for query: "${query}"`);
    
    if (allKnowledge.length > 0) {
      // Filter knowledge relevant to the query
      relevantKnowledge = allKnowledge.filter(item => {
        const searchText = `${item.title} ${item.content || ''}`.toLowerCase();
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ').filter(word => word.length > 2); // Only words longer than 2 chars
        
        // Check if any query word appears in the knowledge
        const isRelevant = queryWords.some(word => searchText.includes(word));
        
        if (isRelevant) {
          console.log(`Knowledge match found: "${item.title}" (${item.type}) matches query "${query}"`);
        }
        
        return isRelevant;
      }).slice(0, 5); // Limit to top 5 relevant items (increased from 3)
      
      // If no specific matches found, include some knowledge for general context
      if (relevantKnowledge.length === 0 && allKnowledge.length > 0) {
        console.log('No specific knowledge matches found, including mixed knowledge');
        // Prioritize company knowledge, but include some platform knowledge
        relevantKnowledge = [
          ...companyKnowledgeData.slice(0, 3),
          ...platformKnowledgeData.slice(0, 2)
        ];
      }
      
      // Create context string from relevant knowledge
      companyContext = relevantKnowledge.map(item => {
        const prefix = item.type === 'platform' ? '[Platform] ' : '[Company] ';
        return `${prefix}${item.title}: ${(item.content || '').substring(0, 1500)}...`;
      }).join('\n\n');
      
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

export { getCompanyContext };