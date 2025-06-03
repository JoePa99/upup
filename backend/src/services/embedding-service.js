const axios = require('axios');
const db = require('../config/database');

/**
 * Service for generating and managing embeddings for knowledge search
 */
const embeddingService = {
  /**
   * Generate embeddings using OpenAI API
   * @param {string} text - The text to generate embeddings for
   * @returns {Promise<Array>} - Vector embedding
   */
  async generateOpenAIEmbedding(text) {
    try {
      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      // Truncate text if it's too long (OpenAI has token limits)
      const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

      // Call OpenAI API to generate embeddings
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: truncatedText,
          model: 'text-embedding-ada-002'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.data && response.data.data[0] && response.data.data[0].embedding) {
        return response.data.data[0].embedding;
      }

      throw new Error('Invalid response format from OpenAI API');
    } catch (error) {
      console.error('Error generating OpenAI embedding:', error.message);
      throw error;
    }
  },

  /**
   * Generate embeddings using Anthropic API
   * @param {string} text - The text to generate embeddings for
   * @returns {Promise<Array>} - Vector embedding
   */
  async generateAnthropicEmbedding(text) {
    try {
      // Validate API key
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      // Truncate text if it's too long (Anthropic has limits)
      const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

      // Call Anthropic API to generate embeddings
      const response = await axios.post(
        'https://api.anthropic.com/v1/embeddings',
        {
          model: "claude-3-sonnet-20240229",
          input: truncatedText
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.embedding) {
        return response.data.embedding;
      }

      throw new Error('Invalid response format from Anthropic API');
    } catch (error) {
      console.error('Error generating Anthropic embedding:', error.message);
      throw error;
    }
  },

  /**
   * Generate embeddings using either OpenAI or Anthropic based on configuration
   * @param {string} text - The text to generate embeddings for
   * @returns {Promise<Array>} - Vector embedding
   */
  async generateEmbedding(text) {
    // Prefer Anthropic if configured, otherwise use OpenAI
    if (process.env.EMBEDDING_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      return this.generateAnthropicEmbedding(text);
    } else if (process.env.OPENAI_API_KEY) {
      return this.generateOpenAIEmbedding(text);
    } else {
      throw new Error('No embedding provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY');
    }
  },

  /**
   * Store embedding in the knowledge search index
   * @param {Object} data - The knowledge data
   * @param {string} data.knowledgeType - Type of knowledge ('platform', 'company', 'user')
   * @param {number} data.knowledgeId - ID of the knowledge document
   * @param {number} data.tenantId - Tenant ID (null for platform knowledge)
   * @param {string} data.content - Content to generate embedding for
   * @param {string} data.title - Title of the knowledge document
   * @returns {Promise<Object>} - Created search index entry
   */
  async storeEmbedding(data) {
    const { knowledgeType, knowledgeId, tenantId, content, title } = data;
    
    try {
      // Generate search text from title and content
      const searchText = `${title} ${content}`;

      // Generate text embedding
      const embedding = await this.generateEmbedding(searchText);

      // Store in database using pgvector
      const { data: existingIndex } = await db.supabaseQuery('knowledge_search_index', {
        select: 'id',
        eq: {
          knowledge_type: knowledgeType,
          knowledge_id: knowledgeId
        }
      });

      if (existingIndex && existingIndex.length > 0) {
        // Update existing entry
        const { data: result, error } = await db.supabaseUpdate(
          'knowledge_search_index',
          {
            search_vector: db.pool.escapeLiteral(searchText), // For text search
            embedding_vector: embedding, // For vector search
            last_indexed_at: new Date().toISOString()
          },
          {
            id: existingIndex[0].id
          },
          { returning: true }
        );

        if (error) throw error;
        return result[0];
      } else {
        // Create new entry
        const { data: result, error } = await db.supabaseInsert(
          'knowledge_search_index',
          {
            knowledge_type: knowledgeType,
            knowledge_id: knowledgeId,
            tenant_id: tenantId,
            search_vector: db.pool.escapeLiteral(searchText), // For text search
            embedding_vector: embedding, // For vector search
            last_indexed_at: new Date().toISOString()
          },
          { returning: true }
        );

        if (error) throw error;
        return result[0];
      }
    } catch (error) {
      console.error(`Error storing embedding for ${knowledgeType} knowledge ${knowledgeId}:`, error);
      throw error;
    }
  },

  /**
   * Find similar knowledge based on text query using vector search
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @param {string} options.knowledgeType - Type of knowledge to search ('platform', 'company', 'user')
   * @param {number} options.tenantId - Tenant ID for company/user knowledge
   * @param {number} options.userId - User ID for user knowledge
   * @param {number} options.limit - Maximum results to return
   * @returns {Promise<Array>} - Search results with similarity scores
   */
  async findSimilarKnowledge(query, options) {
    const { 
      knowledgeTypes = ['platform', 'company', 'user'], 
      tenantId = null, 
      userId = null, 
      limit = 5 
    } = options;
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Construct conditions for the types of knowledge to search
      let knowledgeConditions = [];
      
      if (knowledgeTypes.includes('platform')) {
        knowledgeConditions.push(`(knowledge_type = 'platform')`);
      }
      
      if (knowledgeTypes.includes('company') && tenantId) {
        knowledgeConditions.push(`(knowledge_type = 'company' AND tenant_id = ${tenantId})`);
      }
      
      if (knowledgeTypes.includes('user') && tenantId && userId) {
        knowledgeConditions.push(`(knowledge_type = 'user' AND tenant_id = ${tenantId} AND knowledge_id IN (
          SELECT id FROM user_knowledge WHERE user_id = ${userId}
        ))`);
      }
      
      // If no valid conditions, return empty results
      if (knowledgeConditions.length === 0) {
        return [];
      }
      
      // Construct the WHERE clause
      const whereClause = knowledgeConditions.join(' OR ');
      
      // Perform vector similarity search using pgvector
      const client = await db.getClient();
      
      try {
        // Enable pgvector extension if not already enabled
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        
        // Perform vector similarity search
        const { rows } = await client.query(`
          SELECT 
            knowledge_type,
            knowledge_id,
            tenant_id,
            1 - (embedding_vector <=> $1) as similarity
          FROM 
            knowledge_search_index
          WHERE 
            ${whereClause}
          ORDER BY 
            embedding_vector <=> $1
          LIMIT $2
        `, [queryEmbedding, limit]);
        
        // If no results from vector search, try text search fallback
        if (rows.length === 0) {
          const { rows: textRows } = await client.query(`
            SELECT 
              knowledge_type,
              knowledge_id,
              tenant_id,
              ts_rank(search_vector, plainto_tsquery('english', $1)) as similarity
            FROM 
              knowledge_search_index
            WHERE 
              ${whereClause}
              AND search_vector @@ plainto_tsquery('english', $1)
            ORDER BY 
              similarity DESC
            LIMIT $2
          `, [query, limit]);
          
          return textRows;
        }
        
        return rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in vector similarity search:', error);
      return [];
    }
  },
  
  /**
   * Get knowledge details for search results
   * @param {Array} searchResults - Results from findSimilarKnowledge
   * @returns {Promise<Array>} - Knowledge documents with details
   */
  async getKnowledgeDetails(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }
    
    try {
      const detailedResults = [];
      
      // Group by knowledge type for batch queries
      const platformIds = searchResults
        .filter(r => r.knowledge_type === 'platform')
        .map(r => r.knowledge_id);
        
      const companyResults = searchResults.filter(r => r.knowledge_type === 'company');
      const userResults = searchResults.filter(r => r.knowledge_type === 'user');
      
      // Get platform knowledge details
      if (platformIds.length > 0) {
        const { data: platformKnowledge } = await db.supabaseQuery('platform_knowledge', {
          select: 'id, title, document_type, category, tags, content',
          in: { id: platformIds }
        });
        
        if (platformKnowledge) {
          platformKnowledge.forEach(doc => {
            const searchResult = searchResults.find(r => 
              r.knowledge_type === 'platform' && r.knowledge_id === doc.id
            );
            
            if (searchResult) {
              detailedResults.push({
                ...doc,
                knowledge_type: 'platform',
                relevance_score: searchResult.similarity
              });
            }
          });
        }
      }
      
      // Get company knowledge details
      if (companyResults.length > 0) {
        // Group by tenant_id for separate queries
        const tenantGroups = companyResults.reduce((groups, result) => {
          const tenantId = result.tenant_id;
          if (!groups[tenantId]) {
            groups[tenantId] = [];
          }
          groups[tenantId].push(result.knowledge_id);
          return groups;
        }, {});
        
        // Query each tenant's knowledge
        for (const [tenantId, ids] of Object.entries(tenantGroups)) {
          const { data: companyKnowledge } = await db.supabaseQuery('company_knowledge', {
            select: 'id, title, document_type, category, tags, content',
            eq: { tenant_id: tenantId },
            in: { id: ids }
          });
          
          if (companyKnowledge) {
            companyKnowledge.forEach(doc => {
              const searchResult = searchResults.find(r => 
                r.knowledge_type === 'company' && 
                r.knowledge_id === doc.id && 
                r.tenant_id === parseInt(tenantId)
              );
              
              if (searchResult) {
                detailedResults.push({
                  ...doc,
                  knowledge_type: 'company',
                  tenant_id: parseInt(tenantId),
                  relevance_score: searchResult.similarity
                });
              }
            });
          }
        }
      }
      
      // Get user knowledge details
      if (userResults.length > 0) {
        // Group by tenant_id for separate queries
        const tenantGroups = userResults.reduce((groups, result) => {
          const tenantId = result.tenant_id;
          if (!groups[tenantId]) {
            groups[tenantId] = [];
          }
          groups[tenantId].push(result.knowledge_id);
          return groups;
        }, {});
        
        // Query each tenant's user knowledge
        for (const [tenantId, ids] of Object.entries(tenantGroups)) {
          const { data: userKnowledge } = await db.supabaseQuery('user_knowledge', {
            select: 'id, title, document_type, project_name, tags, content, user_id',
            eq: { tenant_id: tenantId },
            in: { id: ids }
          });
          
          if (userKnowledge) {
            userKnowledge.forEach(doc => {
              const searchResult = searchResults.find(r => 
                r.knowledge_type === 'user' && 
                r.knowledge_id === doc.id && 
                r.tenant_id === parseInt(tenantId)
              );
              
              if (searchResult) {
                detailedResults.push({
                  ...doc,
                  knowledge_type: 'user',
                  tenant_id: parseInt(tenantId),
                  relevance_score: searchResult.similarity
                });
              }
            });
          }
        }
      }
      
      // Sort by relevance score
      return detailedResults.sort((a, b) => b.relevance_score - a.relevance_score);
    } catch (error) {
      console.error('Error getting knowledge details:', error);
      return [];
    }
  }
};

module.exports = embeddingService;