/**
 * Simplified Knowledge Controller - No dependencies on databases or embeddings
 * For production use in environments with configuration challenges
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// In-memory storage for knowledge (will be lost on server restart)
let companyKnowledge = [];
let sessionKnowledge = [];

// Storage directory for persistence
const STORAGE_DIR = path.join(__dirname, '..', '..', 'data');
const COMPANY_FILE = path.join(STORAGE_DIR, 'company-knowledge.json');
const SESSION_FILE = path.join(STORAGE_DIR, 'session-knowledge.json');

// Create storage directory if it doesn't exist
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  
  // Load existing knowledge if available
  if (fs.existsSync(COMPANY_FILE)) {
    const data = fs.readFileSync(COMPANY_FILE, 'utf8');
    companyKnowledge = JSON.parse(data);
  }
  
  if (fs.existsSync(SESSION_FILE)) {
    const data = fs.readFileSync(SESSION_FILE, 'utf8');
    sessionKnowledge = JSON.parse(data);
  }
} catch (error) {
  console.error('Error initializing knowledge storage:', error);
}

// Helper to save knowledge to file
const saveToFile = (data, filePath) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error saving to ${filePath}:`, error);
  }
};

const knowledgeControllerSimple = {
  // Company Admin: Upload company-wide knowledge
  async uploadCompanyKnowledge(req, res) {
    try {
      const { title, content, documentType, category, tags, isPublic, metadata } = req.body;
      const tenantId = req.user?.tenantId || 'dev-tenant';
      const userId = req.user?.id || 'dev-user';
      
      // Basic validation
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title and content are required'
        });
      }
      
      // Create knowledge entry
      const knowledge = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        title,
        content,
        document_type: documentType || 'general',
        category: category || 'general',
        tags: Array.isArray(tags) ? tags : [],
        status: 'active',
        created_by: userId,
        is_public: isPublic !== false,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to in-memory storage
      companyKnowledge.push(knowledge);
      
      // Save to file
      saveToFile(companyKnowledge, COMPANY_FILE);
      
      res.status(201).json({
        success: true,
        data: knowledge,
        message: 'Company knowledge uploaded successfully'
      });
    } catch (error) {
      console.error('Error in simplified company knowledge upload:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while uploading knowledge',
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
      
      const tenantId = req.user?.tenantId || 'dev-tenant';
      const userId = req.user?.id || 'dev-user';
      
      // Basic validation
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title and content are required'
        });
      }
      
      // Create knowledge entry
      const knowledge = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        user_id: userId,
        title,
        content,
        document_type: documentType || 'general',
        project_name: projectName || null,
        tags: Array.isArray(tags) ? tags : [],
        status: 'active',
        is_session_specific: isSessionSpecific !== false,
        expires_at: expiresAt || null,
        metadata: {
          ...(metadata || {}),
          session_id: sessionId || `session_${Date.now()}`
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to in-memory storage
      sessionKnowledge.push(knowledge);
      
      // Save to file
      saveToFile(sessionKnowledge, SESSION_FILE);
      
      res.status(201).json({
        success: true,
        data: knowledge,
        message: 'Session knowledge uploaded successfully'
      });
    } catch (error) {
      console.error('Error in simplified session knowledge upload:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while uploading knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  // Get company knowledge
  async getCompanyKnowledge(req, res) {
    try {
      const tenantId = req.user?.tenantId || 'dev-tenant';
      
      // Filter by tenant ID
      const filteredKnowledge = companyKnowledge.filter(item => 
        item.tenant_id === tenantId && item.status === 'active'
      );
      
      res.json({
        success: true,
        data: {
          knowledge: filteredKnowledge,
          total: filteredKnowledge.length
        }
      });
    } catch (error) {
      console.error('Error in simplified company knowledge retrieval:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving knowledge'
      });
    }
  },
  
  // Get user's session knowledge
  async getSessionKnowledge(req, res) {
    try {
      const tenantId = req.user?.tenantId || 'dev-tenant';
      const userId = req.user?.id || 'dev-user';
      const { sessionId } = req.query;
      
      // Filter by tenant ID and user ID
      let filteredKnowledge = sessionKnowledge.filter(item => 
        item.tenant_id === tenantId && 
        item.user_id === userId &&
        item.status === 'active'
      );
      
      // Further filter by session ID if provided
      if (sessionId) {
        filteredKnowledge = filteredKnowledge.filter(item => 
          item.metadata?.session_id === sessionId
        );
      }
      
      res.json({
        success: true,
        data: {
          knowledge: filteredKnowledge,
          total: filteredKnowledge.length
        }
      });
    } catch (error) {
      console.error('Error in simplified session knowledge retrieval:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving knowledge'
      });
    }
  },
  
  // Get knowledge context for AI
  async getKnowledgeContext(req, res) {
    try {
      const tenantId = req.user?.tenantId || 'dev-tenant';
      const userId = req.user?.id || 'dev-user';
      const { sessionId, includeContent = false } = req.query;
      
      // Get platform knowledge (empty for simplified version)
      const platformKnowledge = [];
      
      // Get company knowledge
      const companyKnowledgeItems = companyKnowledge
        .filter(item => item.tenant_id === tenantId && item.status === 'active')
        .slice(0, 3)
        .map(item => ({
          id: item.id,
          title: item.title,
          document_type: item.document_type,
          category: item.category,
          relevance_score: 0.8,
          content: includeContent === 'true' ? item.content : null
        }));
      
      // Get session knowledge
      let sessionKnowledgeItems = [];
      if (sessionId) {
        sessionKnowledgeItems = sessionKnowledge
          .filter(item => 
            item.tenant_id === tenantId && 
            item.user_id === userId && 
            item.status === 'active' &&
            item.metadata?.session_id === sessionId
          )
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            title: item.title,
            document_type: item.document_type,
            project_name: item.project_name,
            relevance_score: 0.9,
            content: includeContent === 'true' ? item.content : null
          }));
      }
      
      const result = {
        platform_knowledge: platformKnowledge,
        company_knowledge: companyKnowledgeItems,
        session_knowledge: sessionKnowledgeItems,
        context_summary: {
          total_sources: platformKnowledge.length + companyKnowledgeItems.length + sessionKnowledgeItems.length,
          platform_sources: platformKnowledge.length,
          company_sources: companyKnowledgeItems.length,
          session_sources: sessionKnowledgeItems.length,
          estimated_tokens: 0
        }
      };
      
      res.json({
        success: true,
        data: result,
        message: 'Knowledge context retrieved successfully'
      });
    } catch (error) {
      console.error('Error in simplified knowledge context retrieval:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving knowledge context'
      });
    }
  },
  
  // Delete knowledge
  async deleteKnowledge(req, res) {
    try {
      const { id } = req.params;
      const { knowledgeType } = req.body; // 'company' or 'session'
      const tenantId = req.user?.tenantId || 'dev-tenant';
      const userId = req.user?.id || 'dev-user';
      
      if (knowledgeType === 'company') {
        // Find knowledge item
        const index = companyKnowledge.findIndex(item => 
          item.id === id && item.tenant_id === tenantId
        );
        
        if (index !== -1) {
          // Mark as deleted instead of removing
          companyKnowledge[index].status = 'deleted';
          companyKnowledge[index].updated_at = new Date().toISOString();
          
          // Save to file
          saveToFile(companyKnowledge, COMPANY_FILE);
          
          return res.json({
            success: true,
            message: 'Company knowledge deleted successfully',
            deleted_id: id
          });
        }
      } else if (knowledgeType === 'session') {
        // Find knowledge item
        const index = sessionKnowledge.findIndex(item => 
          item.id === id && 
          item.tenant_id === tenantId && 
          item.user_id === userId
        );
        
        if (index !== -1) {
          // Mark as deleted instead of removing
          sessionKnowledge[index].status = 'deleted';
          sessionKnowledge[index].updated_at = new Date().toISOString();
          
          // Save to file
          saveToFile(sessionKnowledge, SESSION_FILE);
          
          return res.json({
            success: true,
            message: 'Session knowledge deleted successfully',
            deleted_id: id
          });
        }
      }
      
      // If we get here, the knowledge item wasn't found
      res.status(404).json({
        success: false,
        message: 'Knowledge item not found'
      });
    } catch (error) {
      console.error('Error in simplified knowledge deletion:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting knowledge'
      });
    }
  }
};

module.exports = knowledgeControllerSimple;