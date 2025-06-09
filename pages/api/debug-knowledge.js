import { getCompanyContext } from '../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query = 'tires' } = req.body;
    
    console.log('=== KNOWLEDGE DEBUG ENDPOINT ===');
    console.log('Query:', query);
    console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Get company context for debugging
    const companyContext = await getCompanyContext(query, req);
    
    console.log('=== KNOWLEDGE DEBUG RESULTS ===');
    console.log('Tenant company:', companyContext.tenantInfo.companyName);
    console.log('Knowledge items found:', companyContext.relevantKnowledge.length);
    console.log('Knowledge context length:', companyContext.companyContext.length);
    console.log('Full knowledge context:', companyContext.companyContext);
    console.log('Relevant knowledge array:', JSON.stringify(companyContext.relevantKnowledge, null, 2));

    return res.status(200).json({
      success: true,
      debug: {
        query,
        tenantInfo: companyContext.tenantInfo,
        knowledgeContextLength: companyContext.companyContext.length,
        knowledgeContext: companyContext.companyContext,
        relevantKnowledgeCount: companyContext.relevantKnowledge.length,
        relevantKnowledge: companyContext.relevantKnowledge,
        hasKnowledge: companyContext.relevantKnowledge.length > 0
      }
    });

  } catch (error) {
    console.error('Knowledge debug error:', error);
    return res.status(500).json({
      message: 'Knowledge debug failed',
      error: error.message
    });
  }
}