const { logUsage } = require('../services/usage-service');
const knowledgeService = require('../services/knowledge-service');
const documentService = require('../services/document-service');

const knowledgeController = {
  // Company Admin: Upload company-wide knowledge (text or file)
  async uploadCompanyKnowledge(req, res) {
    try {
      const { title, content, documentType, category, tags, isPublic, metadata } = req.body;
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const uploadedFile = req.file;

      // Validate required fields
      if (!title || (!content && !uploadedFile)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title and either content or file are required'
        });
      }

      let finalContent = content || '';
      let finalMetadata = metadata || {};

      // Process uploaded file if present
      if (uploadedFile) {
        try {
          const processedDocument = await documentService.processDocument(
            uploadedFile, 
            tenantId, 
            userId, 
            'company'
          );
          
          // Use extracted text content if available
          if (processedDocument.textContent && !finalContent) {
            finalContent = processedDocument.textContent;
          }
          
          // Merge file metadata with provided metadata
          finalMetadata = {
            ...finalMetadata,
            ...processedDocument.metadata,
            fileInfo: processedDocument.fileInfo,
            hasEmbeddings: !!processedDocument.embeddings
          };
        } catch (fileError) {
          console.error('Error processing uploaded file:', fileError);
          // Continue with text content only
          finalMetadata.fileProcessingError = fileError.message;
        }
      }

      // Create knowledge document in database
      const knowledgeData = {
        title,
        content: finalContent,
        documentType: documentType || 'general',
        category: category || 'general',
        tags: tags || [],
        isPublic: isPublic !== false,
        metadata: finalMetadata
      };

      const companyKnowledge = await knowledgeService.createCompanyKnowledge(
        knowledgeData,
        tenantId,
        userId
      );

      // Log usage
      await logUsage(tenantId, 'knowledge_uploads', 1);

      res.status(201).json({
        success: true,
        data: companyKnowledge,
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
      const { 
        title, 
        content, 
        documentType, 
        projectName,
        sessionId, 
        tags,
        isSessionSpecific,
        expiresAt,
        metadata 
      } = req.body;
      
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const uploadedFile = req.file;

      if (!title || (!content && !uploadedFile)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title and either content or file are required'
        });
      }

      let finalContent = content || '';
      let finalMetadata = metadata || {};

      // Process uploaded file if present
      if (uploadedFile) {
        try {
          const processedDocument = await documentService.processDocument(
            uploadedFile, 
            tenantId, 
            userId, 
            'session'
          );
          
          // Use extracted text content if available
          if (processedDocument.textContent && !finalContent) {
            finalContent = processedDocument.textContent;
          }
          
          // Merge file metadata with provided metadata
          finalMetadata = {
            ...finalMetadata,
            ...processedDocument.metadata,
            fileInfo: processedDocument.fileInfo,
            hasEmbeddings: !!processedDocument.embeddings
          };
        } catch (fileError) {
          console.error('Error processing uploaded file:', fileError);
          // Continue with text content only
          finalMetadata.fileProcessingError = fileError.message;
        }
      }

      // Create session knowledge in database
      const knowledgeData = {
        title,
        content: finalContent,
        documentType: documentType || 'general',
        projectName,
        sessionId: sessionId || `session_${Date.now()}`,
        tags: tags || [],
        isSessionSpecific: isSessionSpecific !== false,
        expiresAt: expiresAt || null,
        metadata: finalMetadata
      };

      const sessionKnowledge = await knowledgeService.createSessionKnowledge(
        knowledgeData,
        tenantId,
        userId
      );

      // Log usage
      await logUsage(tenantId, 'knowledge_uploads', 1);

      res.status(201).json({
        success: true,
        data: sessionKnowledge,
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
      const { 
        limit = 50, 
        offset = 0, 
        category, 
        documentType, 
        status = 'active',
        query 
      } = req.query;

      const options = {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        category,
        documentType,
        status,
        query
      };

      const result = await knowledgeService.getCompanyKnowledge(tenantId, options);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting company knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve company knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get user's session knowledge
  async getSessionKnowledge(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { 
        sessionId,
        limit = 50, 
        offset = 0, 
        projectName, 
        documentType, 
        status = 'active' 
      } = req.query;

      const options = {
        sessionId,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        projectName,
        documentType,
        status
      };

      const result = await knowledgeService.getSessionKnowledge(tenantId, userId, options);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting session knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Get hierarchical knowledge context for AI
  async getKnowledgeContext(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { 
        sessionId, 
        includeContent = false,
        query = '',
        limit = 3,
        knowledge_types
      } = req.query;

      const options = {
        sessionId,
        includeContent: includeContent === 'true',
        query,
        limit: parseInt(limit, 10),
        knowledge_types: knowledge_types ? knowledge_types.split(',') : ['platform', 'company', 'session']
      };

      const knowledgeContext = await knowledgeService.getKnowledgeContext(
        tenantId,
        userId,
        options
      );

      res.json({
        success: true,
        data: knowledgeContext,
        message: 'Knowledge context retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting knowledge context:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve knowledge context',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

      // Permission check for company knowledge
      if (knowledgeType === 'company' && !['admin', 'company_admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete company knowledge'
        });
      }

      const success = await knowledgeService.deleteKnowledge(
        id,
        knowledgeType,
        tenantId,
        userId
      );

      if (success) {
        res.json({
          success: true,
          message: `${knowledgeType} knowledge deleted successfully`,
          deleted_id: id
        });
      } else {
        throw new Error('Knowledge deletion failed');
      }

    } catch (error) {
      console.error('Error deleting knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = knowledgeController;