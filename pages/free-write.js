import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';
import FloatingPinButton from '../components/FloatingPinButton';
import AISuggestionsPopover from '../components/AISuggestionsPopover';
import { useUsageTracking } from '../hooks/useUsageTracking';

const FreeWriteGenerator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { trackContentGenerated } = useUsageTracking();
  const router = useRouter();
  const [formData, setFormData] = useState({
    prompt: '',
    useKnowledgeBase: true,
    creativity: 0.7,
    additionalContext: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [showPinsSidebar, setShowPinsSidebar] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [aiPopover, setAiPopover] = useState({ isOpen: false, fieldName: '', fieldType: '' });
  
  // Refs for AI assist buttons
  const aiAssistRefs = {
    prompt: useRef(null),
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreativityChange = (e) => {
    setFormData(prev => ({
      ...prev,
      creativity: parseFloat(e.target.value)
    }));
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
    if (!formData.prompt.trim()) {
      alert('Please enter a prompt to generate content');
      return;
    }

    setIsLoading(true);
    setShowContent(false);
    
    try {
      // Import the API helper to get auth headers
      const { apiRequest } = await import('../utils/api-config');
      
      const data = await apiRequest('/content/free-write', {
        method: 'POST',
        body: JSON.stringify({
          prompt: formData.prompt,
          useKnowledgeBase: formData.useKnowledgeBase,
          creativity: formData.creativity,
          additionalContext: formData.additionalContext
        })
      });

      // data is already parsed JSON from apiRequest helper
      setGeneratedContent(data.data.content);
      setContentTitle(data.data.title || `Free Write: ${formData.prompt.substring(0, 50)}...`);
      setShowContent(true);
      setHasGenerated(true);
      
      // Track successful content generation
      trackContentGenerated('free-write', 600); // Estimate 600 tokens for free write
    } catch (error) {
      console.error('Free write generation error:', error);
      
      // Fallback to mock content if API fails
      const fallbackContent = `This is a creative exploration of "${formData.prompt}". 

The concept invites us to consider multiple perspectives and possibilities. When we approach this topic with fresh eyes, we discover layers of meaning that might not be immediately apparent.

Consider how this idea connects to broader themes in your industry and market. The implications could extend beyond the obvious, creating opportunities for innovation and differentiation.

What if we viewed this from a completely different angle? Sometimes the most valuable insights come from questioning our initial assumptions and exploring unconventional approaches.

The beauty of creative thinking lies in its ability to transform simple prompts into rich, meaningful content that resonates with audiences and drives engagement.`;
      
      setGeneratedContent(fallbackContent);
      setContentTitle(`Free Write: ${formData.prompt.substring(0, 50)}...`);
      setShowContent(true);
      setHasGenerated(true);
      
      // Track fallback content generation (no tokens used)
      trackContentGenerated('free-write', 0);
      
      // Show user-friendly error message
      alert('Content generated using fallback mode. Please check your internet connection or contact support if this persists.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCreativityLabel = (value) => {
    if (value <= 0.3) return 'Conservative';
    if (value <= 0.5) return 'Balanced';
    if (value <= 0.7) return 'Creative';
    if (value <= 0.9) return 'Bold';
    return 'Experimental';
  };

  return (
    <Layout title="Free Write | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">✍️ Free Write</h1>
        <p className="page-subtitle">Generate creative copy from any prompt - pin the best parts for later use</p>
      </div>

      <div className="generator-header">
        <div className="input-group">
          <div className="input-field full-width">
            <label htmlFor="prompt">Your Prompt</label>
            <div className="input-with-ai">
              <textarea 
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                placeholder="Describe what you want to write about... Be specific or abstract, the choice is yours!"
                rows="4"
              />
              <button 
                ref={aiAssistRefs.prompt}
                className="ai-assist-btn" 
                onClick={() => aiAssist('prompt', 'textarea')}
                type="button"
                style={{ top: '20px' }}
              >
                AI Assist
              </button>
            </div>
          </div>

          <div className="input-field">
            <label>
              <input 
                type="checkbox"
                name="useKnowledgeBase"
                checked={formData.useKnowledgeBase}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              Use Knowledge Base Context
            </label>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              {formData.useKnowledgeBase ? 
                'Content will reference your uploaded company knowledge' : 
                'Content will be generated without company-specific context'
              }
            </div>
          </div>

          <div className="input-field">
            <label htmlFor="creativity">
              Creativity Level: {getCreativityLabel(formData.creativity)} ({Math.round(formData.creativity * 100)}%)
            </label>
            <input 
              type="range"
              name="creativity"
              min="0.1"
              max="1.0"
              step="0.1"
              value={formData.creativity}
              onChange={handleCreativityChange}
              className="creativity-slider"
            />
            <div className="slider-labels">
              <span>Conservative</span>
              <span>Experimental</span>
            </div>
          </div>

          <div className="input-field full-width">
            <label htmlFor="additionalContext">Additional Context & Style</label>
            <div className="input-with-ai">
              <textarea 
                name="additionalContext"
                value={formData.additionalContext}
                onChange={handleInputChange}
                placeholder="Any specific tone, style, audience, or requirements for the content..."
                rows="2"
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
              {hasGenerated ? 'Regenerate' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Creating your free write content...</div>
        </div>
      )}

      {showContent && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent}
            title={contentTitle}
            sourceType="free-write"
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
        generatorType="free-write"
        triggerRef={aiAssistRefs[aiPopover.fieldName]}
      />
    </Layout>
  );
};

export default FreeWriteGenerator;