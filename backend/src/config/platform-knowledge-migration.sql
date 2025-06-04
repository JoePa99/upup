-- Create platform_knowledge table for platform-wide knowledge base
CREATE TABLE IF NOT EXISTS platform_knowledge (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(255),
    file_size INTEGER,
    content_type VARCHAR(100),
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    document_type VARCHAR(50) DEFAULT 'best_practices',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_platform_knowledge_category ON platform_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_platform_knowledge_status ON platform_knowledge(status);
CREATE INDEX IF NOT EXISTS idx_platform_knowledge_document_type ON platform_knowledge(document_type);
CREATE INDEX IF NOT EXISTS idx_platform_knowledge_created_at ON platform_knowledge(created_at);

-- Create full-text search index for content
CREATE INDEX IF NOT EXISTS idx_platform_knowledge_content_search ON platform_knowledge USING gin(to_tsvector('english', title || ' ' || content));

-- Add comments for documentation
COMMENT ON TABLE platform_knowledge IS 'Platform-wide knowledge base available to all companies';
COMMENT ON COLUMN platform_knowledge.category IS 'Knowledge category: HR, Legal, Sales, Marketing, Finance, Operations, General';
COMMENT ON COLUMN platform_knowledge.document_type IS 'Document type: best_practices, compliance, templates, industry_standards';
COMMENT ON COLUMN platform_knowledge.status IS 'Status: active, inactive, archived';
COMMENT ON COLUMN platform_knowledge.usage_count IS 'Number of times this knowledge has been referenced in content generation';