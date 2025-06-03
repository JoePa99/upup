const db = require('../config/database');
const documentService = require('./document-service');
const embeddingService = require('./embedding-service');

/**
 * Knowledge service for managing company and user knowledge
 */
const knowledgeService = {
  /**
   * Create company knowledge item
   * @param {Object} data - Knowledge data
   * @param {number} tenantId - Tenant ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Created knowledge item
   */
  async createCompanyKnowledge(data, tenantId, userId) {
    try {
      const { title, content, documentType, tags = [], category = 'general', isPublic = true, metadata = {} } = data;
      
      // Prepare knowledge data
      const knowledgeData = {
        tenant_id: tenantId,
        title,
        content,
        document_type: documentType,
        category,
        tags: Array.isArray(tags) ? tags : [],
        status: 'active',
        created_by: userId,
        is_public: isPublic,
        metadata,
        version: 1
      };
      
      // Insert knowledge using Supabase
      const { data: createdKnowledge, error } = await db.supabaseInsert(
        'company_knowledge',
        knowledgeData,
        { returning: true }
      );
      
      if (error) {
        console.error('Error creating company knowledge:', error);
        throw error;
      }
      
      // If successful, create search index entry with embeddings
      if (createdKnowledge && createdKnowledge.length > 0) {
        const knowledge = createdKnowledge[0];
        
        // Generate search vector - basic implementation
        await db.query(`
          UPDATE company_knowledge 
          SET search_vector = to_tsvector('english', $1)
          WHERE id = $2
        `, [`${title} ${content}`, knowledge.id]);
        
        // Generate and store embeddings
        try {
          await documentService.generateEmbeddings(
            content,
            title,
            'company',
            knowledge.id,
            tenantId
          );
          
          // Update metadata to indicate embeddings were created
          const { data: updatedKnowledge } = await db.supabaseUpdate(
            'company_knowledge',
            {
              metadata: {
                ...metadata,
                has_embeddings: true,
                embedding_created_at: new Date().toISOString()
              }
            },
            { id: knowledge.id },
            { returning: true }
          );
          
          if (updatedKnowledge && updatedKnowledge.length > 0) {
            return updatedKnowledge[0];
          }
        } catch (embeddingError) {
          console.error('Error generating embeddings for company knowledge:', embeddingError);
          // Continue without embeddings
        }
        
        return knowledge;
      }
      
      throw new Error('Failed to create company knowledge');
    } catch (error) {
      console.error('Error in knowledge service - createCompanyKnowledge:', error);
      throw error;
    }
  },
  
  /**
   * Get company knowledge for a tenant
   * @param {number} tenantId - Tenant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Company knowledge items
   */
  async getCompanyKnowledge(tenantId, options = {}) {
    try {
      const { limit = 50, offset = 0, category, documentType, status = 'active', query } = options;
      
      // Build query options
      const queryOptions = {
        select: `
          id,
          tenant_id,
          title,
          document_type,
          category,
          tags,
          status,
          created_by,
          version,
          is_public,
          created_at,
          updated_at,
          metadata
        `,
        eq: { 
          tenant_id: tenantId,
          status
        },
        limit,
        range: { from: offset, to: offset + limit - 1 },
        order: { column: 'created_at', ascending: false }
      };
      
      // Add optional filters
      if (category) {
        queryOptions.eq.category = category;
      }
      
      if (documentType) {
        queryOptions.eq.document_type = documentType;
      }
      
      // If text search query is provided, use full text search
      let knowledgeItems = [];
      
      if (query && query.trim()) {
        // For text search, use PostgreSQL's full-text search capabilities
        const client = await db.getClient();
        try {
          const { rows } = await client.query(`
            SELECT 
              id, tenant_id, title, document_type, category, tags, status, 
              created_by, version, is_public, created_at, updated_at, metadata
            FROM 
              company_knowledge
            WHERE 
              tenant_id = $1
              AND status = $2
              ${category ? 'AND category = $3' : ''}
              ${documentType ? `AND document_type = $${category ? 4 : 3}` : ''}
              AND search_vector @@ plainto_tsquery('english', $${category && documentType ? 5 : category || documentType ? 4 : 3})
            ORDER BY 
              ts_rank(search_vector, plainto_tsquery('english', $${category && documentType ? 5 : category || documentType ? 4 : 3})) DESC
            LIMIT $${category && documentType ? 6 : category || documentType ? 5 : 4}
            OFFSET $${category && documentType ? 7 : category || documentType ? 6 : 5}
          `, [
            tenantId, 
            status,
            ...(category ? [category] : []),
            ...(documentType ? [documentType] : []),
            query,
            limit,
            offset
          ]);
          
          knowledgeItems = rows;
        } finally {
          client.release();
        }
      } else {
        // Standard query without text search
        const { data, error } = await db.supabaseQuery('company_knowledge', queryOptions);
        
        if (error) {
          console.error('Error getting company knowledge:', error);
          throw error;
        }
        
        knowledgeItems = data || [];
      }
      
      // Get total count for pagination
      const { data: countData, error: countError } = await db.supabaseQuery('company_knowledge', {
        select: 'count(*)',
        eq: { 
          tenant_id: tenantId,
          status
        }
      });
      
      if (countError) {
        console.error('Error getting knowledge count:', countError);
      }
      
      // Get user details for created_by
      if (knowledgeItems && knowledgeItems.length > 0) {
        const userIds = [...new Set(knowledgeItems.map(item => item.created_by))].filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: users } = await db.supabaseQuery('users', {
            select: 'id, first_name, last_name, email',
            in: { id: userIds }
          });
          
          if (users && users.length > 0) {
            // Map user details to knowledge items
            return {
              knowledge: knowledgeItems.map(item => {
                const user = users.find(u => u.id === item.created_by);
                return {
                  ...item,
                  created_by_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Unknown',
                  size_kb: item.metadata?.fileSize ? Math.round(item.metadata.fileSize / 1024) : 0
                };
              }),
              total: countData?.[0]?.count || knowledgeItems.length,
              limit,
              offset
            };
          }
        }
      }
      
      return {
        knowledge: knowledgeItems.map(item => ({
          ...item,
          created_by_name: 'Unknown',
          size_kb: item.metadata?.fileSize ? Math.round(item.metadata.fileSize / 1024) : 0
        })),
        total: countData?.[0]?.count || knowledgeItems.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error in knowledge service - getCompanyKnowledge:', error);
      throw error;
    }
  },
  
  /**
   * Create user session knowledge item
   * @param {Object} data - Knowledge data
   * @param {number} tenantId - Tenant ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Created knowledge item
   */
  async createSessionKnowledge(data, tenantId, userId) {
    try {
      const { 
        title, 
        content, 
        documentType, 
        projectName = null, 
        tags = [], 
        isSessionSpecific = true, 
        expiresAt = null, 
        metadata = {},
        sessionId 
      } = data;
      
      // Prepare knowledge data
      const knowledgeData = {
        tenant_id: tenantId,
        user_id: userId,
        title,
        content,
        document_type: documentType,
        project_name: projectName,
        tags: Array.isArray(tags) ? tags : [],
        status: 'active',
        is_session_specific: isSessionSpecific,
        expires_at: expiresAt,
        metadata: {
          ...metadata,
          session_id: sessionId
        }
      };
      
      // Insert knowledge using Supabase
      const { data: createdKnowledge, error } = await db.supabaseInsert(
        'user_knowledge',
        knowledgeData,
        { returning: true }
      );
      
      if (error) {
        console.error('Error creating session knowledge:', error);
        throw error;
      }
      
      if (createdKnowledge && createdKnowledge.length > 0) {
        const knowledge = createdKnowledge[0];
        
        // Generate search vector - basic implementation
        await db.query(`
          UPDATE user_knowledge 
          SET search_vector = to_tsvector('english', $1)
          WHERE id = $2
        `, [`${title} ${content}`, knowledge.id]);
        
        // Generate and store embeddings
        try {
          await documentService.generateEmbeddings(
            content,
            title,
            'user',
            knowledge.id,
            tenantId
          );
          
          // Update metadata to indicate embeddings were created
          const { data: updatedKnowledge } = await db.supabaseUpdate(
            'user_knowledge',
            {
              metadata: {
                ...knowledge.metadata,
                has_embeddings: true,
                embedding_created_at: new Date().toISOString()
              }
            },
            { id: knowledge.id },
            { returning: true }
          );
          
          if (updatedKnowledge && updatedKnowledge.length > 0) {
            return updatedKnowledge[0];
          }
        } catch (embeddingError) {
          console.error('Error generating embeddings for session knowledge:', embeddingError);
          // Continue without embeddings
        }
        
        return knowledge;
      }
      
      throw new Error('Failed to create session knowledge');
    } catch (error) {
      console.error('Error in knowledge service - createSessionKnowledge:', error);
      throw error;
    }
  },
  
  /**
   * Get user session knowledge
   * @param {number} tenantId - Tenant ID
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - User session knowledge items
   */
  async getSessionKnowledge(tenantId, userId, options = {}) {
    try {
      const { limit = 50, offset = 0, projectName, documentType, sessionId, status = 'active', query } = options;
      
      // Build query options
      const queryOptions = {
        select: `
          id,
          tenant_id,
          user_id,
          title,
          document_type,
          project_name,
          tags,
          status,
          is_session_specific,
          expires_at,
          metadata,
          created_at,
          updated_at
        `,
        eq: { 
          tenant_id: tenantId,
          user_id: userId,
          status
        },
        limit,
        range: { from: offset, to: offset + limit - 1 },
        order: { column: 'created_at', ascending: false }
      };
      
      // Add optional filters
      if (projectName) {
        queryOptions.eq.project_name = projectName;
      }
      
      if (documentType) {
        queryOptions.eq.document_type = documentType;
      }
      
      // If text search query is provided, use full text search
      let knowledgeItems = [];
      
      if (query && query.trim()) {
        // For text search, use PostgreSQL's full-text search capabilities
        const client = await db.getClient();
        try {
          const { rows } = await client.query(`
            SELECT 
              id, tenant_id, user_id, title, document_type, project_name, 
              tags, status, is_session_specific, expires_at, metadata, created_at, updated_at
            FROM 
              user_knowledge
            WHERE 
              tenant_id = $1
              AND user_id = $2
              AND status = $3
              ${projectName ? 'AND project_name = $4' : ''}
              ${documentType ? `AND document_type = $${projectName ? 5 : 4}` : ''}
              AND search_vector @@ plainto_tsquery('english', $${projectName && documentType ? 6 : projectName || documentType ? 5 : 4})
            ORDER BY 
              ts_rank(search_vector, plainto_tsquery('english', $${projectName && documentType ? 6 : projectName || documentType ? 5 : 4})) DESC
            LIMIT $${projectName && documentType ? 7 : projectName || documentType ? 6 : 5}
            OFFSET $${projectName && documentType ? 8 : projectName || documentType ? 7 : 6}
          `, [
            tenantId, 
            userId,
            status,
            ...(projectName ? [projectName] : []),
            ...(documentType ? [documentType] : []),
            query,
            limit,
            offset
          ]);
          
          knowledgeItems = rows;
        } finally {
          client.release();
        }
      } else {
        // Standard query without text search
        const { data, error } = await db.supabaseQuery('user_knowledge', queryOptions);
        
        if (error) {
          console.error('Error getting user knowledge:', error);
          throw error;
        }
        
        knowledgeItems = data || [];
      }
      
      // Filter by session ID if provided (check in metadata)
      let filteredData = knowledgeItems;
      if (sessionId) {
        filteredData = knowledgeItems.filter(item => {
          return item.metadata?.session_id === sessionId;
        });
      }
      
      // Get total count for pagination
      const { data: countData, error: countError } = await db.supabaseQuery('user_knowledge', {
        select: 'count(*)',
        eq: { 
          tenant_id: tenantId,
          user_id: userId,
          status
        }
      });
      
      if (countError) {
        console.error('Error getting knowledge count:', countError);
      }
      
      return {
        knowledge: filteredData.map(item => ({
          ...item,
          session_id: item.metadata?.session_id,
          size_kb: item.metadata?.fileSize ? Math.round(item.metadata.fileSize / 1024) : 0
        })),
        total: countData?.[0]?.count || knowledgeItems.length,
        filtered_total: filteredData.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error in knowledge service - getSessionKnowledge:', error);
      throw error;
    }
  },
  
  /**
   * Delete knowledge item
   * @param {number} id - Knowledge ID
   * @param {string} knowledgeType - 'company' or 'session'
   * @param {number} tenantId - Tenant ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteKnowledge(id, knowledgeType, tenantId, userId) {
    try {
      const tableName = knowledgeType === 'company' ? 'company_knowledge' : 'user_knowledge';
      
      // Build match criteria
      const match = { id, tenant_id: tenantId };
      
      // For session knowledge, ensure user owns it
      if (knowledgeType === 'session') {
        match.user_id = userId;
      }
      
      // First get the knowledge item to check for file attachments
      const { data: knowledgeItem } = await db.supabaseQuery(tableName, {
        select: 'id, metadata',
        eq: match,
        limit: 1
      });
      
      // Delete associated file if exists
      if (knowledgeItem && knowledgeItem.length > 0 && 
          knowledgeItem[0].metadata && 
          knowledgeItem[0].metadata.fileInfo && 
          knowledgeItem[0].metadata.fileInfo.fileName) {
        try {
          await documentService.deleteFromStorage(knowledgeItem[0].metadata.fileInfo.fileName);
        } catch (fileError) {
          console.error(`Error deleting associated file for ${knowledgeType} knowledge:`, fileError);
          // Continue with knowledge deletion even if file deletion fails
        }
      }
      
      // Delete associated embedding from search index
      try {
        await db.supabaseDelete('knowledge_search_index', {
          knowledge_type: knowledgeType,
          knowledge_id: id
        });
      } catch (embeddingError) {
        console.error(`Error deleting embedding for ${knowledgeType} knowledge:`, embeddingError);
        // Continue with knowledge deletion even if embedding deletion fails
      }
      
      // Delete knowledge using Supabase
      const { error } = await db.supabaseDelete(tableName, match);
      
      if (error) {
        console.error(`Error deleting ${knowledgeType} knowledge:`, error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error(`Error in knowledge service - deleteKnowledge (${knowledgeType}):`, error);
      throw error;
    }
  },
  
  /**
   * Get knowledge context for AI prompts using vector search
   * @param {number} tenantId - Tenant ID
   * @param {number} userId - User ID
   * @param {Object} options - Context options
   * @returns {Promise<Object>} - Knowledge context
   */
  async getKnowledgeContext(tenantId, userId, options = {}) {
    try {
      const { 
        sessionId = null, 
        query = '', 
        includeContent = false,
        limit = 3, // Limit per knowledge level
        knowledge_types = ['platform', 'company', 'session']
      } = options;
      
      const result = {
        platform_knowledge: [],
        company_knowledge: [],
        session_knowledge: [],
        context_summary: {
          total_sources: 0,
          platform_sources: 0,
          company_sources: 0,
          session_sources: 0,
          estimated_tokens: 0
        }
      };
      
      // Function to estimate tokens (very rough approximation)
      const estimateTokens = (text = '') => Math.ceil(text.length / 4);
      
      // If query is provided, use vector search for semantic relevance
      if (query && query.trim().length > 3) {
        try {
          // Perform vector similarity search
          const searchResults = await embeddingService.findSimilarKnowledge(query, {
            knowledgeTypes: knowledge_types,
            tenantId,
            userId,
            limit: limit * 3 // Get more results than needed to allow for filtering
          });
          
          if (searchResults && searchResults.length > 0) {
            // Get detailed knowledge items
            const detailedResults = await embeddingService.getKnowledgeDetails(searchResults);
            
            // Group results by knowledge type
            const platformResults = detailedResults
              .filter(r => r.knowledge_type === 'platform')
              .slice(0, limit);
              
            const companyResults = detailedResults
              .filter(r => r.knowledge_type === 'company')
              .slice(0, limit);
              
            const sessionResults = detailedResults
              .filter(r => r.knowledge_type === 'user' && 
                (!sessionId || r.metadata?.session_id === sessionId))
              .slice(0, limit);
            
            // Add to result object
            result.platform_knowledge = platformResults.map(doc => ({
              id: doc.id,
              title: doc.title,
              document_type: doc.document_type,
              category: doc.category,
              relevance_score: doc.relevance_score,
              content: includeContent ? doc.content : null
            }));
            
            result.company_knowledge = companyResults.map(doc => ({
              id: doc.id,
              title: doc.title,
              document_type: doc.document_type,
              category: doc.category,
              relevance_score: doc.relevance_score,
              content: includeContent ? doc.content : null
            }));
            
            result.session_knowledge = sessionResults.map(doc => ({
              id: doc.id,
              title: doc.title,
              document_type: doc.document_type,
              project_name: doc.project_name,
              relevance_score: doc.relevance_score,
              content: includeContent ? doc.content : null
            }));
            
            // Update counts
            result.context_summary.platform_sources = result.platform_knowledge.length;
            result.context_summary.company_sources = result.company_knowledge.length;
            result.context_summary.session_sources = result.session_knowledge.length;
            
            // Estimate tokens
            if (includeContent) {
              result.platform_knowledge.forEach(doc => {
                result.context_summary.estimated_tokens += estimateTokens(doc.content || '');
              });
              
              result.company_knowledge.forEach(doc => {
                result.context_summary.estimated_tokens += estimateTokens(doc.content || '');
              });
              
              result.session_knowledge.forEach(doc => {
                result.context_summary.estimated_tokens += estimateTokens(doc.content || '');
              });
            }
          }
        } catch (searchError) {
          console.error('Error performing vector search:', searchError);
          // Fall back to default behavior
        }
      }
      
      // If no results from vector search or no query provided, use default behavior
      if (result.context_summary.total_sources === 0) {
        // Get platform knowledge if requested
        if (knowledge_types.includes('platform')) {
          const { data: platformDocs } = await db.supabaseQuery('platform_knowledge', {
            select: includeContent ? '*' : 'id, title, document_type, category, tags, status, created_at',
            eq: { status: 'active' },
            limit
          });
          
          if (platformDocs?.length) {
            result.platform_knowledge = platformDocs.map(doc => ({
              id: doc.id,
              title: doc.title,
              document_type: doc.document_type,
              category: doc.category,
              relevance_score: 0.7, // Mock score - would be from vector similarity
              content: includeContent ? doc.content : null
            }));
            
            result.context_summary.platform_sources = platformDocs.length;
            if (includeContent) {
              platformDocs.forEach(doc => {
                result.context_summary.estimated_tokens += estimateTokens(doc.content || '');
              });
            }
          }
        }
        
        // Get company knowledge if requested
        if (knowledge_types.includes('company')) {
          const { data: companyDocs } = await db.supabaseQuery('company_knowledge', {
            select: includeContent ? '*' : 'id, title, document_type, category, tags, status, created_at',
            eq: { 
              tenant_id: tenantId,
              status: 'active'
            },
            limit
          });
          
          if (companyDocs?.length) {
            result.company_knowledge = companyDocs.map(doc => ({
              id: doc.id,
              title: doc.title,
              document_type: doc.document_type,
              category: doc.category,
              relevance_score: 0.85, // Mock score - would be from vector similarity
              content: includeContent ? doc.content : null
            }));
            
            result.context_summary.company_sources = companyDocs.length;
            if (includeContent) {
              companyDocs.forEach(doc => {
                result.context_summary.estimated_tokens += estimateTokens(doc.content || '');
              });
            }
          }
        }
        
        // Get session knowledge if requested
        if (knowledge_types.includes('session') && sessionId) {
          // Get knowledge specific to this session
          const { data: sessionDocs } = await db.supabaseQuery('user_knowledge', {
            select: includeContent ? '*' : 'id, title, document_type, project_name, tags, status, created_at, metadata',
            eq: { 
              tenant_id: tenantId,
              user_id: userId,
              status: 'active'
            },
            limit
          });
          
          // Filter by session ID from metadata
          const filteredSessionDocs = sessionDocs?.filter(doc => doc.metadata?.session_id === sessionId) || [];
          
          if (filteredSessionDocs.length) {
            result.session_knowledge = filteredSessionDocs.map(doc => ({
              id: doc.id,
              title: doc.title,
              document_type: doc.document_type,
              project_name: doc.project_name,
              relevance_score: 0.95, // Mock score - would be from vector similarity
              content: includeContent ? doc.content : null
            }));
            
            result.context_summary.session_sources = filteredSessionDocs.length;
            if (includeContent) {
              filteredSessionDocs.forEach(doc => {
                result.context_summary.estimated_tokens += estimateTokens(doc.content || '');
              });
            }
          }
        }
      }
      
      // Update total sources
      result.context_summary.total_sources = 
        result.context_summary.platform_sources + 
        result.context_summary.company_sources + 
        result.context_summary.session_sources;
      
      return result;
    } catch (error) {
      console.error('Error in knowledge service - getKnowledgeContext:', error);
      throw error;
    }
  },
  
  /**
   * Log knowledge usage for analytics
   * @param {Object} data - Usage data
   * @returns {Promise<boolean>} - Success status
   */
  async logKnowledgeUsage(data) {
    try {
      const { 
        tenant_id, 
        user_id, 
        knowledge_type, 
        knowledge_id, 
        usage_context, 
        generation_id = null 
      } = data;
      
      const usageData = {
        tenant_id,
        user_id,
        knowledge_type,
        knowledge_id,
        usage_context,
        generation_id
      };
      
      const { error } = await db.supabaseInsert('knowledge_usage', usageData);
      
      if (error) {
        console.error('Error logging knowledge usage:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in knowledge service - logKnowledgeUsage:', error);
      return false;
    }
  }
};

module.exports = knowledgeService;