// Company knowledge API endpoint in Next.js pages/api
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Handle knowledge upload
    try {
      const { title, content, documentType } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title, content'
        });
      }
      
      const mockKnowledge = {
        id: Date.now(),
        title,
        content,
        document_type: documentType || 'text',
        created_at: new Date().toISOString(),
        knowledge_level: 'company'
      };
      
      res.status(200).json({
        success: true,
        data: mockKnowledge,
        message: 'Company knowledge uploaded successfully (Next.js API route)'
      });
    } catch (error) {
      console.error('Knowledge upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Knowledge upload failed',
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    // Handle knowledge retrieval
    const mockKnowledge = [
      {
        id: 1,
        title: 'Brand Guidelines 2024',
        document_type: 'brand_guide',
        created_at: '2024-01-15T10:30:00Z',
        created_by_name: 'System Admin',
        size_kb: 2450
      },
      {
        id: 2,
        title: 'Company Policies',
        document_type: 'policy',
        created_at: '2024-01-10T14:20:00Z',
        created_by_name: 'System Admin',
        size_kb: 1890
      }
    ];
    
    res.status(200).json({
      success: true,
      data: {
        knowledge: mockKnowledge,
        total: mockKnowledge.length
      },
      note: 'From Next.js API route'
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}