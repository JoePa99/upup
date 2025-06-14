import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';
import FloatingPinButton from '../components/FloatingPinButton';
import AISuggestionsPopover from '../components/AISuggestionsPopover';
import { useUsageTracking } from '../hooks/useUsageTracking';

const ContentGenerator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { trackContentGenerated } = useUsageTracking();
  const router = useRouter();
  const [formData, setFormData] = useState({
    contentTopic: '',
    contentType: 'Blog Post',
    contentAudience: '',
    otherContentType: '',
    additionalContext: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [showPinsSidebar, setShowPinsSidebar] = useState(false);
  const [aiPopover, setAiPopover] = useState({ isOpen: false, fieldName: '', fieldType: '' });
  
  // Refs for AI assist buttons
  const aiAssistRefs = {
    contentTopic: useRef(null),
    contentAudience: useRef(null),
    additionalContext: useRef(null)
  };

  // Use useEffect for client-side redirects only
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Don't render anything on server if not authenticated
  if (typeof window === 'undefined' && !isAuthenticated) {
    return null;
  }

  // Don't render anything on client if not authenticated (until redirect happens)
  if (typeof window !== 'undefined' && !isAuthenticated) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOtherOption = (selectValue) => {
    if (selectValue === 'other') {
      // Show other input field logic can be added here
    }
  };

  const aiAssist = (fieldName, fieldType = 'input') => {
    setAiPopover({
      isOpen: true,
      fieldName,
      fieldType
    });
  };

  const handleSuggestionSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      [aiPopover.fieldName]: suggestion
    }));
  };

  const closeAiPopover = () => {
    setAiPopover({ isOpen: false, fieldName: '', fieldType: '' });
  };

  const generateContent = async () => {
    setIsLoading(true);
    setShowContent(false);
    setGeneratedContent(''); // Clear previous content
    
    try {
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use FastAPI streaming endpoint
      const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://upup-production.up.railway.app';
      
      const response = await fetch(`${fastApiUrl}/generate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: formData.contentTopic || 'customer retention',
          contentType: formData.contentType === 'other' ? formData.otherContentType : formData.contentType,
          audience: formData.contentAudience || 'professional customers',
          additionalContext: formData.additionalContext || null,
          pins: [] // No pins for regular content generation
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let hasMetadata = false;

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
                  // Process metadata silently (no more popup)
                  if (!hasMetadata) {
                    hasMetadata = true;
                    const metadata = data.data;
                    console.log(`Knowledge base status: ${metadata.hasKnowledge ? `Found ${metadata.knowledgeItems} items` : 'No specific knowledge found'}`);
                  }
                  break;
                  
                case 'content':
                  // Stream content in real-time
                  setGeneratedContent(prev => prev + data.data);
                  if (!showContent) {
                    setShowContent(true);
                    setContentTitle(`Strategic Content: ${formData.contentTopic || 'Customer Retention'}`);
                  }
                  break;
                  
                case 'complete':
                  setIsLoading(false);
                  // Track successful content generation
                  trackContentGenerated('content', 800);
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
      console.error('Content generation error:', error);
      
      // Fallback to mock content if API fails
      const fallbackContent = `Building authentic customer relationships starts with understanding that trust isn't built overnight—it's earned through consistent actions over time. Your customers are constantly evaluating whether your brand delivers on its promises, not just in your premium products, but in every interaction they have with your company. The most successful businesses recognize that customer trust is their most valuable asset, worth more than any short-term revenue boost from aggressive pricing tactics. When customers trust your brand, they become advocates who refer others, provide honest feedback about new products, and stick with you even when competitors offer cheaper alternatives. Modern consumers have access to unlimited information and options, which means they can easily spot inauthentic marketing messages from brands trying too hard to be trendy. The companies that thrive are those that speak honestly about their values and capabilities, rather than making unrealistic promises about instant success. Social proof through customer testimonials and case studies has become crucial, but only when it feels genuine rather than manufactured for marketing purposes. Your company's response to product issues often matters more than preventing every single problem, as it shows how you handle challenges and treat customers when things go wrong. Transparency in your processes and commitment to sustainable practices builds confidence and reduces the friction that causes customers to hesitate before making premium purchases. The most powerful trust-building strategy is to consistently deliver slightly more value than customers expect, creating positive surprises that they remember and share with others.`;
      
      setGeneratedContent(fallbackContent);
      setContentTitle(`Strategic Content: ${formData.contentTopic || 'Customer Retention'}`);
      setShowContent(true);
      // Don't auto-open pinboard - user can now use floating button
      
      // Track fallback content generation (no tokens used)
      trackContentGenerated('content', 0);
      
      // Show user-friendly error message
      alert('Content generated using fallback mode. Please check your internet connection or contact support if this persists.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Content Generator | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">✨ Content Generator</h1>
        <p className="page-subtitle">Generate strategic content tailored to your brand and market position</p>
      </div>

      <div className="generator-header">
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="contentTopic">Content Topic</label>
            <div className="input-with-ai">
              <input 
                type="text" 
                name="contentTopic"
                value={formData.contentTopic}
                onChange={handleInputChange}
                placeholder="e.g., customer retention, holiday marketing"
              />
              <button 
                ref={aiAssistRefs.contentTopic}
                className="ai-assist-btn" 
                onClick={() => aiAssist('contentTopic', 'input')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <div className="input-field">
            <label htmlFor="contentType">Content Type</label>
            <select 
              name="contentType"
              value={formData.contentType}
              onChange={handleInputChange}
            >
              <option>Blog Post</option>
              <option>Email Campaign</option>
              <option>Social Media</option>
              <option>Landing Page</option>
              <option>Newsletter</option>
              <option value="other">Other (specify)</option>
            </select>
            {formData.contentType === 'other' && (
              <div className="other-input show">
                <input 
                  type="text" 
                  name="otherContentType"
                  value={formData.otherContentType}
                  onChange={handleInputChange}
                  placeholder="Please specify..."
                />
              </div>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="contentAudience">Target Audience</label>
            <div className="input-with-ai">
              <input 
                type="text" 
                name="contentAudience"
                value={formData.contentAudience}
                onChange={handleInputChange}
                placeholder="Professional artists, design students..."
              />
              <button 
                ref={aiAssistRefs.contentAudience}
                className="ai-assist-btn" 
                onClick={() => aiAssist('contentAudience', 'input')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <div className="input-field full-width">
            <label htmlFor="additionalContext">Additional Context & Requirements</label>
            <div className="input-with-ai">
              <textarea 
                name="additionalContext"
                value={formData.additionalContext}
                onChange={handleInputChange}
                placeholder="Any additional context, specific requirements, tone preferences, or constraints..."
                rows="3"
              />
              <button 
                ref={aiAssistRefs.additionalContext}
                className="ai-assist-btn" 
                onClick={() => aiAssist('additionalContext', 'textarea')}
                type="button"
                style={{ top: '20px' }}
              >
                AI Assist
              </button>
            </div>
          </div>

          <div className="input-field button-field">
            <button className="generate-btn" onClick={generateContent} disabled={isLoading}>
              Generate Content
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Generating strategic content based on your brand positioning...</div>
        </div>
      )}

      {showContent && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent}
            title={contentTitle}
            sourceType="content"
          />
        </div>
      )}

      <PinsSidebar show={showPinsSidebar} onClose={() => setShowPinsSidebar(false)} />
      <FloatingPinButton 
        onTogglePinboard={() => setShowPinsSidebar(!showPinsSidebar)}
        showPinboard={showPinsSidebar}
      />
      
      <AISuggestionsPopover
        isOpen={aiPopover.isOpen}
        onClose={closeAiPopover}
        onSelectSuggestion={handleSuggestionSelect}
        fieldName={aiPopover.fieldName}
        fieldType={aiPopover.fieldType}
        existingFormData={formData}
        generatorType="content"
        triggerRef={aiAssistRefs[aiPopover.fieldName]}
      />
    </Layout>
  );
};

export default ContentGenerator;