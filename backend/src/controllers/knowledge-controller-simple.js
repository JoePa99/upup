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

// Determine storage directory based on environment
let STORAGE_DIR;
let COMPANY_FILE;
let SESSION_FILE;

// In Vercel, we need to use /tmp directory for ephemeral storage
if (process.env.VERCEL) {
  STORAGE_DIR = '/tmp'; // Vercel's writable directory
  console.log('Running in Vercel environment, using /tmp for storage');
} else {
  STORAGE_DIR = path.join(__dirname, '..', '..', 'data');
  console.log('Running in non-Vercel environment, using local data directory');
}

COMPANY_FILE = path.join(STORAGE_DIR, 'company-knowledge.json');
SESSION_FILE = path.join(STORAGE_DIR, 'session-knowledge.json');

console.log(`Storage files: ${COMPANY_FILE}, ${SESSION_FILE}`);

// Create storage directory if it doesn't exist
try {
  console.log(`Storage directory path: ${STORAGE_DIR}`);
  
  // Check if directory exists and create if not
  if (!fs.existsSync(STORAGE_DIR)) {
    console.log('Storage directory does not exist, creating...');
    try {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
      console.log('Storage directory created successfully');
    } catch (mkdirError) {
      console.error('Error creating storage directory:', mkdirError);
      // In production environments like Vercel, we might not have write access
      console.log('Falling back to in-memory storage only');
    }
  } else {
    console.log('Storage directory exists');
  }
  
  // Load existing knowledge if available
  if (fs.existsSync(COMPANY_FILE)) {
    console.log(`Loading company knowledge from ${COMPANY_FILE}`);
    try {
      const data = fs.readFileSync(COMPANY_FILE, 'utf8');
      companyKnowledge = JSON.parse(data);
      console.log(`Loaded ${companyKnowledge.length} company knowledge items`);
    } catch (readError) {
      console.error('Error reading company knowledge file:', readError);
    }
  } else {
    console.log('No existing company knowledge file found');
  }
  
  if (fs.existsSync(SESSION_FILE)) {
    console.log(`Loading session knowledge from ${SESSION_FILE}`);
    try {
      const data = fs.readFileSync(SESSION_FILE, 'utf8');
      sessionKnowledge = JSON.parse(data);
      console.log(`Loaded ${sessionKnowledge.length} session knowledge items`);
    } catch (readError) {
      console.error('Error reading session knowledge file:', readError);
    }
  } else {
    console.log('No existing session knowledge file found');
  }
} catch (error) {
  console.error('Error initializing knowledge storage:', error);
  console.log('Will continue with in-memory storage only');
}

// Helper to save knowledge to file
const saveToFile = (data, filePath) => {
  try {
    console.log(`Attempting to save data to ${filePath}`);
    
    // Check if directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} doesn't exist, attempting to create...`);
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory ${dir}`);
      } catch (mkdirError) {
        console.error(`Failed to create directory ${dir}:`, mkdirError);
        return false; // Cannot save without directory
      }
    }
    
    // Write file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully saved data to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error saving to ${filePath}:`, error);
    return false;
  }
};

const knowledgeControllerSimple = {
  // Company Admin: Upload company-wide knowledge
  async uploadCompanyKnowledge(req, res) {
    try {
      console.log('Starting company knowledge upload...');
      // Extract body data, handling both JSON and form data
      let title, content, documentType, category, tags, isPublic, metadata;
      
      // Check if this is a multipart form (file upload)
      if (req.file) {
        console.log('File upload detected');
        title = req.body.title;
        content = req.body.content || 'File content';
        documentType = req.body.documentType;
        category = req.body.category;
        tags = req.body.tags;
        isPublic = req.body.isPublic;
        metadata = {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileContent: req.file.buffer.toString('base64').substring(0, 100) + '...' // First 100 chars only
        };
      } else {
        // Regular JSON request
        console.log('JSON upload detected');
        ({ title, content, documentType, category, tags, isPublic, metadata } = req.body);
      }
      
      const tenantId = req.user?.tenantId || 'dev-tenant';
      const userId = req.user?.id || 'dev-user';
      
      console.log(`User ID: ${userId}, Tenant ID: ${tenantId}`);
      console.log(`Title: ${title}, Document Type: ${documentType}`);
      
      // Basic validation
      if (!title) {
        console.log('Missing title in request');
        return res.status(400).json({
          success: false,
          message: 'Missing required field: title is required'
        });
      }
      
      if (!content && !req.file) {
        console.log('Missing content in request');
        return res.status(400).json({
          success: false,
          message: 'Missing required field: content or file is required'
        });
      }
      
      // Create knowledge entry
      const knowledge = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        title,
        content: content || 'File content not extracted',
        document_type: documentType || 'general',
        category: category || 'general',
        tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []),
        status: 'active',
        created_by: userId,
        is_public: isPublic !== false,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`Created knowledge entry with ID: ${knowledge.id}`);
      
      // Add to in-memory storage
      companyKnowledge.push(knowledge);
      console.log(`Added to in-memory storage, total items: ${companyKnowledge.length}`);
      
      // Try to save to file, but continue even if it fails (for Vercel)
      const saved = saveToFile(companyKnowledge, COMPANY_FILE);
      console.log(`File save ${saved ? 'succeeded' : 'failed'}`);
      
      // Always return success, even if file save failed
      console.log('Returning success response');
      res.status(201).json({
        success: true,
        data: knowledge,
        message: 'Company knowledge uploaded successfully',
        persistenceStatus: saved ? 'permanent' : 'temporary'
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
      console.log('Starting session knowledge upload...');
      // Extract body data, handling both JSON and form data
      let title, content, documentType, projectName, sessionId, tags, isSessionSpecific, expiresAt, metadata;
      
      // Check if this is a multipart form (file upload)
      if (req.file) {
        console.log('File upload detected');
        title = req.body.title;
        content = req.body.content || 'File content';
        documentType = req.body.documentType;
        projectName = req.body.projectName;
        sessionId = req.body.sessionId;
        tags = req.body.tags;
        isSessionSpecific = req.body.isSessionSpecific;
        expiresAt = req.body.expiresAt;
        metadata = {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileContent: req.file.buffer.toString('base64').substring(0, 100) + '...' // First 100 chars only
        };
      } else {
        // Regular JSON request
        console.log('JSON upload detected');
        ({ 
          title, 
          content, 
          documentType, 
          projectName,
          sessionId, 
          tags,
          isSessionSpecific,
          expiresAt,
          metadata 
        } = req.body);
      }
      
      const tenantId = req.user?.tenantId || 'dev-tenant';
      const userId = req.user?.id || 'dev-user';
      
      console.log(`User ID: ${userId}, Tenant ID: ${tenantId}`);
      console.log(`Title: ${title}, Document Type: ${documentType}, Session ID: ${sessionId}`);
      
      // Basic validation
      if (!title) {
        console.log('Missing title in request');
        return res.status(400).json({
          success: false,
          message: 'Missing required field: title is required'
        });
      }
      
      if (!content && !req.file) {
        console.log('Missing content in request');
        return res.status(400).json({
          success: false,
          message: 'Missing required field: content or file is required'
        });
      }
      
      // Create knowledge entry
      const knowledge = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        user_id: userId,
        title,
        content: content || 'File content not extracted',
        document_type: documentType || 'general',
        project_name: projectName || null,
        tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []),
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
      
      console.log(`Created session knowledge entry with ID: ${knowledge.id}`);
      
      // Add to in-memory storage
      sessionKnowledge.push(knowledge);
      console.log(`Added to in-memory storage, total items: ${sessionKnowledge.length}`);
      
      // Try to save to file, but continue even if it fails (for Vercel)
      const saved = saveToFile(sessionKnowledge, SESSION_FILE);
      console.log(`File save ${saved ? 'succeeded' : 'failed'}`);
      
      // Always return success, even if file save failed
      console.log('Returning success response');
      res.status(201).json({
        success: true,
        data: knowledge,
        message: 'Session knowledge uploaded successfully',
        persistenceStatus: saved ? 'permanent' : 'temporary'
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