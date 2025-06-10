import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';
import FloatingPinButton from '../components/FloatingPinButton';
import AISuggestionsPopover from '../components/AISuggestionsPopover';
import { useUsageTracking } from '../hooks/useUsageTracking';

const SalesTemplates = () => {
  const { isAuthenticated, loading } = useAuth();
  const { trackTemplateUsed } = useUsageTracking();
  const router = useRouter();
  const [formData, setFormData] = useState({
    templateType: 'sales-proposal',
    field1: '',
    field2: 'New Business',
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

  const generateSalesTemplate = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    try {
      // Import the API helper to get auth headers
      const { apiRequest } = await import('../utils/api-config');
      
      const data = await apiRequest('/content/templates/sales', {
        method: 'POST',
        body: JSON.stringify({
          templateType: formData.templateType,
          clientName: formData.field1,
          proposalType: formData.field2,
          requirements: formData.field3
        })
      });
      
      setGeneratedContent(data.data?.content || data.content);
      setContentTitle(data.data?.title || `Sales Document: ${formData.templateType}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      
      // Track successful template generation
      trackTemplateUsed(formData.templateType, 1000); // Estimate 1000 tokens for templates
    } catch (error) {
      console.error('Error generating sales template:', error);
      // Fallback content on error
      const content = `BUSINESS PROPOSAL

Prepared for: ${formData.field1 || 'Metropolitan Art Academy'}
Prepared by: Staedtler Pencils Company
Date: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY

We're excited to present this ${formData.field2.toLowerCase()} proposal for ${formData.field1 || 'Metropolitan Art Academy'} to partner with Staedtler, the world's leading manufacturer of premium writing and drawing instruments. With our 175+ years of German engineering excellence, we're uniquely positioned to support your organization's creative and professional needs.

UNDERSTANDING YOUR CHALLENGES

${formData.field3 || 'Based on our discussions, we understand that your organization values quality, reliability, and professional presentation in all aspects of your work. You\'re looking for writing instruments that reflect your commitment to excellence while providing the precision and consistency your team demands.'}

Our extensive experience in the creative industry has shown us that these challenges are common among organizations that prioritize quality and professional excellence. We've developed solutions specifically designed to address these needs.

PROPOSED SOLUTION

Our Premium Professional Collection offers a comprehensive solution that directly addresses your requirements:

• Precision-engineered pencils and pens designed for professional use
• Consistent quality that reflects your organization's high standards
• Sustainable manufacturing processes aligned with corporate responsibility values
• Flexible ordering and delivery options to meet your operational requirements
• Dedicated account management ensuring seamless ongoing support

WHY CHOOSE STAEDTLER

✓ 175+ years of German engineering excellence and precision craftsmanship
✓ Trusted by creative professionals and leading organizations worldwide
✓ Unwavering commitment to sustainability and environmental responsibility
✓ Comprehensive product range designed for all professional applications
✓ Dedicated account management and personalized customer support
✓ Proven track record of delivering consistent quality and reliability

INVESTMENT & TIMELINE

Based on your specific requirements and organizational needs, we propose a partnership investment that provides exceptional value while meeting your budgetary considerations. Our flexible pricing structure ensures you receive premium products at competitive rates.

Implementation can begin within two weeks of agreement execution, with initial product delivery scheduled to meet your operational timeline.

EXPECTED OUTCOMES

Partnership with Staedtler will deliver:
• Enhanced professional image through premium writing instruments
• Improved productivity with reliable, consistent-performing tools
• Cost efficiency through volume pricing and dedicated account management
• Environmental benefit through sustainable product choices
• Peace of mind with guaranteed quality and responsive support

NEXT STEPS

1. Review and approve this proposal
2. Execute partnership agreement with favorable terms
3. Coordinate initial product delivery and setup
4. Begin ongoing account management and support relationship

We're confident that our partnership will exceed your expectations and contribute to ${formData.field1 || 'Metropolitan Art Academy'}'s continued success. Our commitment to excellence aligns perfectly with your organizational values.

We look forward to beginning this valuable partnership and supporting your team's success with our premium writing instruments.

Best regards,
The Staedtler Team

CONTACT INFORMATION
[Account Manager Details]
[Phone] | [Email]`;
      
      setGeneratedContent(content);
      setContentTitle(`Sales Proposal: ${formData.field1 || 'Metropolitan Art Academy'}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      
      // Track fallback template generation (no tokens used)
      trackTemplateUsed(formData.templateType, 0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Sales Templates | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">💼 Sales Templates</h1>
        <p className="page-subtitle">Create compelling sales materials that drive revenue and build relationships</p>
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
              <option value="sales-proposal">Sales Proposal</option>
              <option value="email-sequence">Email Sequence</option>
              <option value="call-script">Call Script</option>
              <option value="objection-handling">Objection Handling Guide</option>
              <option value="follow-up-templates">Follow-up Templates</option>
              <option value="sales-presentation">Sales Presentation</option>
            </select>
          </div>

          <div className="input-field">
            <label htmlFor="field1">Prospect Company</label>
            <div className="input-with-ai">
              <input 
                type="text" 
                name="field1"
                value={formData.field1}
                onChange={handleInputChange}
                placeholder="Client or prospect name"
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
            <label htmlFor="field2">Proposal Type</label>
            <select 
              name="field2"
              value={formData.field2}
              onChange={handleInputChange}
            >
              <option>New Business</option>
              <option>Existing Client Expansion</option>
              <option>RFP Response</option>
              <option>Partnership Proposal</option>
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
                    placeholder="Please specify proposal type..."
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
            <label htmlFor="field3">Key Pain Points</label>
            <div className="input-with-ai">
              <textarea 
                name="field3"
                value={formData.field3}
                onChange={handleInputChange}
                placeholder="What challenges are you solving for them..."
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

          <button className="generate-btn" onClick={generateSalesTemplate} disabled={isLoading}>
            🤖 Generate Template with AI
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Creating sales materials with your value proposition...</div>
        </div>
      )}

      {showContent && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent}
            title={contentTitle}
            sourceType="sales-template"
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
        generatorType="sales"
        triggerRef={aiAssistRefs[aiPopover.fieldName]}
      />
    </Layout>
  );
};

export default SalesTemplates;