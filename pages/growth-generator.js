import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';
import FloatingPinButton from '../components/FloatingPinButton';
import AISuggestionsPopover from '../components/AISuggestionsPopover';
import { useUsageTracking } from '../hooks/useUsageTracking';

const GrowthGenerator = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { trackContentGenerated } = useUsageTracking();
  const [formData, setFormData] = useState({
    growthFocus: 'Revenue Expansion',
    timeHorizon: 'Next Quarter',
    growthConstraints: '',
    otherGrowthFocus: '',
    otherTimeHorizon: '',
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
    growthConstraints: useRef(null),
    additionalContext: useRef(null),
    otherGrowthFocus: useRef(null),
    otherTimeHorizon: useRef(null)
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

  const generateGrowthOpportunities = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    try {
      // Import the API helper to get auth headers
      const { apiRequest } = await import('../utils/api-config');
      
      const data = await apiRequest('/content/generate/growth', {
        method: 'POST',
        body: JSON.stringify({
          growthFocus: formData.growthFocus,
          timeHorizon: formData.timeHorizon,
          constraints: formData.growthConstraints,
          additionalContext: formData.additionalContext
        })
      });
      
      setGeneratedContent(data.data?.content || data.content);
      setContentTitle(data.data?.title || `Growth Opportunities: ${formData.growthFocus}`);
      setShowContent(true);
      // Don't auto-open pinboard - user can now use floating button
      trackContentGenerated('growth-opportunities', 800);
    } catch (error) {
      console.error('Error generating growth opportunities:', error);
      // Fallback content on error
      const fallbackContent = `Growth opportunity analysis for ${formData.growthFocus} focus with ${formData.timeHorizon} timeline. Based on your constraints: ${formData.constraints}, here are strategic recommendations for business expansion and revenue optimization.`;
      setGeneratedContent(fallbackContent);
      setContentTitle(`Growth Opportunities: ${formData.growthFocus}`);
      setShowContent(true);
      // Don't auto-open pinboard - user can now use floating button
      trackContentGenerated('growth-opportunities', 0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Growth Opportunities | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">📈 Growth Opportunities</h1>
        <p className="page-subtitle">Identify strategic growth opportunities aligned with your company strengths</p>
      </div>

      <div className="generator-header">
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="growthFocus">Growth Focus</label>
            <select 
              name="growthFocus"
              value={formData.growthFocus}
              onChange={handleInputChange}
            >
              <option>Revenue Expansion</option>
              <option>Market Expansion</option>
              <option>Product Development</option>
              <option>Partnership Opportunities</option>
              <option>Operational Efficiency</option>
              <option value="other">Other (specify)</option>
            </select>
            {formData.growthFocus === 'other' && (
              <div className="other-input show">
                <div className="input-with-ai">
                  <input 
                    type="text" 
                    name="otherGrowthFocus"
                    value={formData.otherGrowthFocus}
                    onChange={handleInputChange}
                    placeholder="Please specify growth focus..."
                  />
                  <button 
                    className="ai-assist-btn" 
                    onClick={() => aiAssist('otherGrowthFocus')}
                    type="button"
                  >
                    AI Assist
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="timeHorizon">Time Horizon</label>
            <select 
              name="timeHorizon"
              value={formData.timeHorizon}
              onChange={handleInputChange}
            >
              <option>Next Quarter</option>
              <option>Next 6 Months</option>
              <option>Next Year</option>
              <option>Long-term 2+ Years</option>
              <option value="other">Other (specify)</option>
            </select>
            {formData.timeHorizon === 'other' && (
              <div className="other-input show">
                <div className="input-with-ai">
                  <input 
                    type="text" 
                    name="otherTimeHorizon"
                    value={formData.otherTimeHorizon}
                    onChange={handleInputChange}
                    placeholder="Please specify time horizon..."
                  />
                  <button 
                    className="ai-assist-btn" 
                    onClick={() => aiAssist('otherTimeHorizon')}
                    type="button"
                  >
                    AI Assist
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="growthConstraints">Current Constraints</label>
            <div className="input-with-ai">
              <textarea 
                name="growthConstraints"
                value={formData.growthConstraints}
                onChange={handleInputChange}
                placeholder="Budget limitations, team capacity, market access..."
              />
              <button 
                className="ai-assist-btn" 
                style={{top: '20px'}}
                onClick={() => aiAssist('growthConstraints')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <div className="input-field full-width">
            <label htmlFor="additionalContext">Additional Context & Requirements</label>
            <textarea 
              name="additionalContext"
              value={formData.additionalContext}
              onChange={handleInputChange}
              placeholder="Any additional context, specific requirements, industry factors, or strategic constraints..."
              rows="3"
            />
          </div>

          <div className="input-field button-field">
            <button className="generate-btn" onClick={generateGrowthOpportunities} disabled={isLoading}>
              Generate Opportunities
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Analyzing market opportunities and company strengths...</div>
        </div>
      )}

      {showContent && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent} 
            title={contentTitle} 
            sourceType="growth-generator" 
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
        generatorType="growth"
        triggerRef={aiAssistRefs[aiPopover.fieldName]}
      />
    </Layout>
  );
};

export default GrowthGenerator;