import { useState, useRef } from 'react';

const StreamingContentGenerator = () => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    contentType: 'Blog Post',
    audience: 'General Audience',
    additionalContext: ''
  });

  const contentTypes = [
    'Blog Post',
    'Email Campaign', 
    'Social Media Post',
    'Press Release',
    'Product Description',
    'Marketing Copy',
    'Strategic Content'
  ];

  const audiences = [
    'General Audience',
    'Business Professionals',
    'Potential Customers',
    'Existing Customers',
    'Industry Experts',
    'Investors',
    'Employees'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateStreamingContent = async () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setContent('');
    setMetadata(null);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Get auth token from localStorage (adjust based on your auth system)
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use environment variable for FastAPI URL, fallback to production
      const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://your-fastapi-service.railway.app';
      
      const response = await fetch(`${fastApiUrl}/content/generate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: formData.topic,
          contentType: formData.contentType,
          audience: formData.audience,
          additionalContext: formData.additionalContext || null,
          pins: [] // Add pins if you have them
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'metadata':
                  setMetadata(data.data);
                  break;
                  
                case 'content':
                  setContent(prev => prev + data.data);
                  break;
                  
                case 'complete':
                  setIsGenerating(false);
                  break;
                  
                case 'error':
                  throw new Error(data.data);
                  
                default:
                  console.log('Unknown message type:', data.type);
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation cancelled');
      } else {
        console.error('Streaming error:', error);
        setError(error.message);
      }
      setIsGenerating(false);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const clearContent = () => {
    setContent('');
    setMetadata(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">🚀 Streaming Content Generator</h2>
        
        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., Digital Marketing Trends"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              name="contentType"
              value={formData.contentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            >
              {contentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <select
              name="audience"
              value={formData.audience}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            >
              {audiences.map(audience => (
                <option key={audience} value={audience}>{audience}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <input
              type="text"
              name="additionalContext"
              value={formData.additionalContext}
              onChange={handleInputChange}
              placeholder="e.g., Focus on SMB market"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={generateStreamingContent}
            disabled={isGenerating || !formData.topic.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? '⏳ Generating...' : '🚀 Generate Content'}
          </button>

          {isGenerating && (
            <button
              onClick={stopGeneration}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              ⏹️ Stop
            </button>
          )}

          {content && (
            <button
              onClick={clearContent}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        {/* Metadata Display */}
        {metadata && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="text-sm text-blue-800">
              ✅ Knowledge Base: {metadata.hasKnowledge ? `Found ${metadata.knowledgeItems} relevant items` : 'Using general context'}
              {isGenerating && <span className="ml-2">⏳ Generating content...</span>}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800">❌ Error: {error}</div>
          </div>
        )}

        {/* Content Display */}
        {(content || isGenerating) && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generated Content</h3>
              {isGenerating && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Writing...
                </div>
              )}
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {content}
                {isGenerating && <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1"></span>}
              </div>
            </div>

            {content && !isGenerating && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  ✅ Content generated successfully! ({content.split(' ').length} words)
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingContentGenerator;