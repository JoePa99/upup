import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';
import FloatingPinButton from '../components/FloatingPinButton';
import AISuggestionsPopover from '../components/AISuggestionsPopover';
import { useUsageTracking } from '../hooks/useUsageTracking';

const HRTemplates = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { trackTemplateUsed } = useUsageTracking();
  const [formData, setFormData] = useState({
    templateType: 'job-description',
    field1: '',
    field2: 'Marketing',
    field3: '',
    otherField2: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [showPinsSidebar, setShowPinsSidebar] = useState(false);
  const [aiPopover, setAiPopover] = useState({ isOpen: false, fieldName: '', fieldType: '' });
  
  // Refs for AI assist buttons
  const aiAssistRefs = {
    field1: useRef(null),
    field3: useRef(null),
    otherField2: useRef(null)
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (typeof window === 'undefined' && !isAuthenticated) {
    return null;
  }

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

  const generateHRTemplate = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    try {
      // Import the API helper to get auth headers
      const { apiRequest } = await import('../utils/api-config');
      
      const data = await apiRequest('/content/templates/hr', {
        method: 'POST',
        body: JSON.stringify({
          templateType: formData.templateType,
          jobTitle: formData.field1,
          department: formData.field2,
          responsibilities: formData.field3
        })
      });
      
      setGeneratedContent(data.data?.content || data.content);
      setContentTitle(data.data?.title || `${formData.templateType}: ${formData.field1 || 'HR Document'}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      trackTemplateUsed(formData.templateType, 1000);
    } catch (error) {
      console.error('Error generating HR template:', error);
      // Fallback content on error
      const fallbackContent = `${formData.templateType} for ${formData.field1 || 'Position'} in ${formData.field2 || 'Department'}. This document would include comprehensive details based on your input: ${formData.field3 || 'No additional details provided'}.`;
      setGeneratedContent(fallbackContent);
      setContentTitle(`${formData.templateType}: ${formData.field1 || 'HR Document'}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      trackTemplateUsed(formData.templateType, 0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="HR Templates | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">👥 HR Templates</h1>
        <p className="page-subtitle">Create professional HR documents powered by your company culture and brand voice</p>
      </div>

      <div className="generator-header">
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="templateType">Template Type</label>
            <select 
              name="templateType"
              value={formData.templateType}
              onChange={handleInputChange}
            >
              <option value="job-description">Job Description</option>
              <option value="interview-questions">Interview Questions</option>
              <option value="performance-review">Performance Review</option>
              <option value="employee-handbook">Employee Handbook Section</option>
              <option value="onboarding-checklist">Onboarding Checklist</option>
              <option value="offer-letter">Offer Letter</option>
            </select>
          </div>

          <div className="input-field">
            <label htmlFor="field1">Job Title</label>
            <div className="input-with-ai">
              <input 
                type="text" 
                name="field1"
                value={formData.field1}
                onChange={handleInputChange}
                placeholder="e.g., Senior Marketing Manager"
              />
              <button 
                className="ai-assist-btn" 
                onClick={() => aiAssist('field1')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <div className="input-field">
            <label htmlFor="field2">Department</label>
            <select 
              name="field2"
              value={formData.field2}
              onChange={handleInputChange}
            >
              <option>Marketing</option>
              <option>Sales</option>
              <option>Product</option>
              <option>Engineering</option>
              <option>Operations</option>
              <option>HR</option>
              <option>Finance</option>
              <option value="other">Other (specify)</option>
            </select>
            {formData.field2 === 'other' && (
              <div className="other-input show">
                <div className="input-with-ai">
                  <input 
                    type="text" 
                    name="otherField2"
                    value={formData.otherField2}
                    onChange={handleInputChange}
                    placeholder="Please specify department..."
                  />
                  <button 
                    className="ai-assist-btn" 
                    onClick={() => aiAssist('otherField2')}
                    type="button"
                  >
                    AI Assist
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="field3">Key Responsibilities</label>
            <div className="input-with-ai">
              <textarea 
                name="field3"
                value={formData.field3}
                onChange={handleInputChange}
                placeholder="Describe main responsibilities and requirements..."
              />
              <button 
                className="ai-assist-btn" 
                onClick={() => aiAssist('field3')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <button className="generate-btn" onClick={generateHRTemplate} disabled={isLoading}>
            🤖 Generate Template with AI
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Creating professional HR document with your company voice...</div>
        </div>
      )}

      {showContent && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent}
            title={contentTitle}
            sourceType="hr-template"
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
        generatorType="hr"
        triggerRef={aiAssistRefs[aiPopover.fieldName]}
      />
    </Layout>
  );
};

export default HRTemplates;