const { logUsage } = require('../services/usage-service');
const documentService = require('../services/document-service');

const knowledgeController = {
  // Company Admin: Upload company-wide knowledge (text or file)
  async uploadCompanyKnowledge(req, res) {
    try {
      const { title, content, documentType, metadata } = req.body;
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const uploadedFile = req.file;

      // Validate: either content or file must be provided
      if (!title || (!content && !uploadedFile)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title and either content or file upload'
        });
      }

      let finalContent = content;
      let fileInfo = null;
      let embeddings = null;

      // Process uploaded file if provided
      if (uploadedFile) {
        try {
          const processedDoc = await documentService.processDocument(
            uploadedFile, 
            tenantId, 
            userId, 
            'company'
          );
          
          finalContent = processedDoc.textContent;
          fileInfo = processedDoc.fileInfo;
          embeddings = processedDoc.embeddings;
        } catch (fileError) {
          console.error('File processing error:', fileError);
          return res.status(400).json({
            success: false,
            message: `File upload failed: ${fileError.message}`
          });
        }
      }

      // TODO: Implement database storage for company knowledge
      // For now, return mock response
      const mockKnowledge = {
        id: Date.now(),
        tenant_id: tenantId,
        title,
        content,
        document_type: documentType || 'text',
        metadata: metadata || {},
        created_by: userId,
        created_at: new Date().toISOString(),
        knowledge_level: 'company'
      };

      // Log usage
      await logUsage(tenantId, 'knowledge_uploads', 1);

      res.json({
        success: true,
        data: mockKnowledge,
        message: 'Company knowledge uploaded successfully'
      });

    } catch (error) {
      console.error('Error uploading company knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload company knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // User: Upload session-specific knowledge
  async uploadSessionKnowledge(req, res) {
    try {
      const { title, content, documentType, sessionId, metadata } = req.body;
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title, content'
        });
      }

      // TODO: Implement database storage for session knowledge
      const mockKnowledge = {
        id: Date.now(),
        tenant_id: tenantId,
        user_id: userId,
        session_id: sessionId || `session_${Date.now()}`,
        title,
        content,
        document_type: documentType || 'text',
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        knowledge_level: 'session'
      };

      // Log usage
      await logUsage(tenantId, 'knowledge_uploads', 1);

      res.json({
        success: true,
        data: mockKnowledge,
        message: 'Session knowledge uploaded successfully'
      });

    } catch (error) {
      console.error('Error uploading session knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload session knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get company knowledge (Company Admin and Users can view)
  async getCompanyKnowledge(req, res) {
    try {
      const tenantId = req.user.tenantId;

      // TODO: Implement database query for company knowledge
      // For now, return mock data
      const mockCompanyKnowledge = [
        {
          id: 1,
          title: 'Brand Guidelines 2024',
          document_type: 'brand_guide',
          created_at: '2024-01-15T10:30:00Z',
          created_by_name: 'Sarah Johnson',
          size_kb: 2450,
          knowledge_level: 'company'
        },
        {
          id: 2,
          title: 'Company Policies & Procedures',
          document_type: 'policy',
          created_at: '2024-01-10T14:20:00Z',
          created_by_name: 'Mike Chen',
          size_kb: 1890,
          knowledge_level: 'company'
        },
        {
          id: 3,
          title: 'Product Knowledge Base',
          document_type: 'product_info',
          created_at: '2024-01-08T09:15:00Z',
          created_by_name: 'Lisa Rodriguez',
          size_kb: 3200,
          knowledge_level: 'company'
        }
      ];

      res.json({
        success: true,
        data: {
          knowledge: mockCompanyKnowledge,
          total: mockCompanyKnowledge.length,
          tenant_id: tenantId
        }
      });

    } catch (error) {
      console.error('Error getting company knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve company knowledge'
      });
    }
  },

  // Get user's session knowledge
  async getSessionKnowledge(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { sessionId } = req.query;

      // TODO: Implement database query for session knowledge
      const mockSessionKnowledge = [
        {
          id: 101,
          title: 'Q4 Campaign Brief',
          document_type: 'campaign_brief',
          session_id: 'session_123',
          created_at: '2024-01-20T11:00:00Z',
          size_kb: 450,
          knowledge_level: 'session'
        },
        {
          id: 102,
          title: 'Market Research Notes',
          document_type: 'research',
          session_id: 'session_123',
          created_at: '2024-01-20T11:30:00Z',
          size_kb: 780,
          knowledge_level: 'session'
        }
      ];

      const filteredKnowledge = sessionId 
        ? mockSessionKnowledge.filter(k => k.session_id === sessionId)
        : mockSessionKnowledge;

      res.json({
        success: true,
        data: {
          knowledge: filteredKnowledge,
          total: filteredKnowledge.length,
          user_id: userId,
          session_id: sessionId
        }
      });

    } catch (error) {
      console.error('Error getting session knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session knowledge'
      });
    }
  },

  // Get hierarchical knowledge context for AI
  async getKnowledgeContext(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { sessionId, includeContent = false } = req.query;

      // TODO: Implement actual knowledge retrieval from database
      // This would query platform, company, and session knowledge
      
      const mockContext = {
        platform_knowledge: [
          {
            id: 'platform_1',
            title: 'Strategic Planning Framework',
            relevance_score: 0.85,
            content: includeContent ? 'Strategic planning involves...' : null
          },
          {
            id: 'platform_2', 
            title: 'Marketing Best Practices',
            relevance_score: 0.72,
            content: includeContent ? 'Effective marketing requires...' : null
          }
        ],
        company_knowledge: [
          {
            id: 'company_1',
            title: 'Brand Guidelines 2024',
            relevance_score: 0.95,
            content: includeContent ? 'Our brand voice is...' : null
          },
          {
            id: 'company_2',
            title: 'Target Audience Personas',
            relevance_score: 0.88,
            content: includeContent ? 'Our primary audience...' : null
          }
        ],
        session_knowledge: sessionId ? [
          {
            id: 'session_1',
            title: 'Q4 Campaign Brief',
            relevance_score: 0.98,
            content: includeContent ? 'Q4 campaign focuses on...' : null
          }
        ] : [],
        context_summary: {
          total_sources: 5,
          platform_sources: 2,
          company_sources: 2,
          session_sources: 1,
          estimated_tokens: 1250
        }
      };

      res.json({
        success: true,
        data: mockContext,
        message: 'Knowledge context retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting knowledge context:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve knowledge context'
      });
    }
  },

  // Delete knowledge (with appropriate permissions)
  async deleteKnowledge(req, res) {
    try {
      const { id } = req.params;
      const { knowledgeType } = req.body; // 'company' or 'session'
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Permission check
      if (knowledgeType === 'company' && !['admin', 'company_admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete company knowledge'
        });
      }

      // TODO: Implement actual deletion from database
      // For now, return success
      res.json({
        success: true,
        message: `${knowledgeType} knowledge deleted successfully`,
        deleted_id: id
      });

    } catch (error) {
      console.error('Error deleting knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete knowledge'
      });
    }
  }
};

module.exports = knowledgeController;