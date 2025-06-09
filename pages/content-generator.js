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
    
    try {
      // Import the API helper to get auth headers
      const { apiRequest } = await import('../utils/api-config');
      
      const data = await apiRequest('/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          contentTopic: formData.contentTopic || 'customer retention',
          contentType: formData.contentType === 'other' ? formData.otherContentType : formData.contentType,
          contentAudience: formData.contentAudience || 'professional customers',
          additionalContext: formData.additionalContext
        })
      });

      // data is already parsed JSON from apiRequest helper
      setGeneratedContent(data.data.content);
      setContentTitle(data.data.title || `Strategic Content: ${formData.contentTopic || 'Customer Retention'}`);
      setShowContent(true);
      
      // Debug: Log knowledge base information
      if (data.debug) {
        console.log('=== KNOWLEDGE DEBUG INFO ===');
        console.log('Knowledge found:', data.debug.knowledgeFound);
        console.log('Knowledge context length:', data.debug.knowledgeContextLength);
        console.log('Has knowledge base:', data.debug.hasKnowledgeBase);
        console.log('Knowledge context:', data.debug.knowledgeContext);
        console.log('Relevant knowledge:', data.debug.relevantKnowledge);
        
        // Show alert with debug info for easy viewing
        if (!data.debug.hasKnowledgeBase) {
          alert(`🚨 NO KNOWLEDGE BASE FOUND!\n\nCompany: ${data.debug.tenantInfo?.companyName}\nKnowledge items: ${data.debug.knowledgeFound}\n\nThis is why the content uses generic placeholders instead of specific company information.`);
        } else {
          alert(`✅ Knowledge base found!\n\nCompany: ${data.debug.tenantInfo?.companyName}\nKnowledge items: ${data.debug.knowledgeFound}\nContext length: ${data.debug.knowledgeContextLength} characters\n\nCheck browser console for full details.`);
        }
      }
      
      // Track successful content generation
      trackContentGenerated('content', 800); // Estimate 800 tokens for content generation
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