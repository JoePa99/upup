import { getCompanyContext } from '../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    console.log('Debug knowledge context for query:', query);
    
    // Get company context
    const companyContext = await getCompanyContext(query || 'legal contract', req);
    
    console.log('Company context result:', {
      tenantInfo: companyContext.tenantInfo,
      relevantKnowledgeCount: companyContext.relevantKnowledge.length,
      contextLength: companyContext.companyContext.length,
      relevantKnowledge: companyContext.relevantKnowledge.map(k => ({
        title: k.title,
        excerptLength: k.excerpt?.length || 0
      }))
    });

    return res.status(200).json({
      success: true,
      data: {
        query: query || 'legal contract',
        tenantInfo: companyContext.tenantInfo,
        relevantKnowledgeCount: companyContext.relevantKnowledge.length,
        relevantKnowledge: companyContext.relevantKnowledge,
        companyContextLength: companyContext.companyContext.length,
        companyContextPreview: companyContext.companyContext.substring(0, 500),
        hasKnowledgeBase: companyContext.relevantKnowledge.length > 0
      }
    });

  } catch (error) {
    console.error('Debug knowledge context error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
}