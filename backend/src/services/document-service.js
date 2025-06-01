const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Configure multer for memory storage (Vercel doesn't have persistent file system)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.'));
    }
  }
});

// Initialize Supabase client for file storage
const getSupabaseClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return null;
  }
  
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
};

const documentService = {
  // Multer middleware for file uploads
  uploadMiddleware: upload.single('document'),

  // Upload document to Supabase Storage
  async uploadToStorage(file, tenantId, userId, knowledgeType = 'company') {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase not configured for file storage');
    }

    const fileName = `${knowledgeType}/${tenantId}/${userId}/${Date.now()}_${file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from('knowledge-documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    return {
      fileName: data.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname
    };
  },

  // Extract text content from different file types
  async extractTextContent(file) {
    const mimeType = file.mimetype;
    let textContent = '';

    try {
      if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
        // Plain text files
        textContent = file.buffer.toString('utf8');
      } else if (mimeType === 'application/pdf') {
        // PDF extraction (placeholder - would need pdf-parse or similar)
        textContent = 'PDF content extraction not yet implemented. Please copy and paste content manually.';
      } else if (mimeType.includes('word')) {
        // Word document extraction (placeholder - would need mammoth or similar)
        textContent = 'Word document extraction not yet implemented. Please copy and paste content manually.';
      }

      return textContent;
    } catch (error) {
      console.error('Error extracting text content:', error);
      return 'Error extracting text content. Please copy and paste content manually.';
    }
  },

  // Generate embeddings for text content (using pgvector)
  async generateEmbeddings(textContent) {
    // Placeholder for embedding generation
    // In a full implementation, this would:
    // 1. Split text into chunks
    // 2. Call OpenAI/Anthropic embedding API
    // 3. Return vector embeddings for storage in pgvector
    
    if (!textContent || textContent.length < 10) {
      return null;
    }

    // Mock embedding (in reality, this would be a call to OpenAI embeddings API)
    const mockEmbedding = Array(1536).fill(0).map(() => Math.random() - 0.5);
    
    return {
      embedding: mockEmbedding,
      chunks: [
        {
          text: textContent.substring(0, 500),
          embedding: mockEmbedding
        }
      ]
    };
  },

  // Process uploaded document and prepare for knowledge storage
  async processDocument(file, tenantId, userId, knowledgeType = 'company') {
    try {
      // Extract text content
      const textContent = await this.extractTextContent(file);
      
      // Upload file to storage
      const fileInfo = await this.uploadToStorage(file, tenantId, userId, knowledgeType);
      
      // Generate embeddings (if text content is available)
      const embeddings = textContent.length > 10 ? await this.generateEmbeddings(textContent) : null;
      
      return {
        textContent,
        fileInfo,
        embeddings,
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          hasEmbeddings: !!embeddings
        }
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  },

  // Delete document from storage
  async deleteFromStorage(fileName) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase not configured for file storage');
    }

    const { error } = await supabase.storage
      .from('knowledge-documents')
      .remove([fileName]);

    if (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }

    return true;
  },

  // Get public URL for a document
  async getPublicUrl(fileName) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    const { data } = supabase.storage
      .from('knowledge-documents')
      .getPublicUrl(fileName);

    return data?.publicUrl || null;
  }
};

module.exports = documentService;