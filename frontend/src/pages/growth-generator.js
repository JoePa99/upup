import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';

const GrowthGenerator = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    growthFocus: 'Revenue Expansion',
    timeHorizon: 'Next Quarter',
    growthConstraints: '',
    otherGrowthFocus: '',
    otherTimeHorizon: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [showPinsSidebar, setShowPinsSidebar] = useState(false);

  // Use useEffect for client-side redirects only
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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

  const aiAssist = (fieldName) => {
    const suggestions = {
      growthConstraints: ['Limited marketing budget', 'Small team capacity', 'Seasonal demand fluctuations', 'Supply chain dependencies', 'Regulatory compliance requirements'],
      otherGrowthFocus: ['Customer Retention', 'Digital Transformation', 'Sustainability Initiatives', 'Innovation Pipeline', 'Brand Expansion'],
      otherTimeHorizon: ['Next Month', 'Next 18 Months', 'Next 3-5 Years', 'Next Decade', 'Ongoing']
    };
    
    const fieldSuggestions = suggestions[fieldName] || [];
    const randomSuggestion = fieldSuggestions[Math.floor(Math.random() * fieldSuggestions.length)];
    
    if (randomSuggestion) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: randomSuggestion
      }));
    }
  };

  const generateGrowthOpportunities = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    // Simulate API call
    setTimeout(() => {
      const content = `Staedtler's revenue expansion opportunities lie in leveraging your premium brand positioning to capture higher-value market segments within the specified timeframe. The growing market of professional digital artists who still value traditional sketching tools represents a $2.3 billion opportunity that aligns perfectly with your precision engineering heritage. Your German craftsmanship story resonates powerfully with design schools and professional artists who prioritize quality over price, creating natural upselling opportunities from basic pencils to premium drawing sets. The trend toward mindful creativity and analog experiences among younger professionals opens doors for Staedtler to position drawing and sketching as premium lifestyle activities, not just functional tools. Partnership opportunities with high-end art schools, design agencies, and creative co-working spaces could generate recurring revenue through bulk purchasing agreements and brand partnership deals. Your existing relationship with art supply retailers provides the foundation for expanded product placement in premium sections, potentially increasing average transaction value by 35-40%. The rise of adult coloring and artistic therapy markets presents opportunities to develop specialized product lines that command premium pricing while serving growing wellness trends. E-commerce expansion beyond traditional art supply channels into lifestyle and luxury goods platforms could capture customers who view quality writing instruments as status symbols rather than just tools. International expansion into emerging markets with growing creative professional populations offers revenue growth potential that leverages your existing manufacturing capabilities and brand heritage. Subscription box partnerships with creative learning platforms could create recurring revenue streams while introducing Staedtler products to artists who might not otherwise discover your premium offerings.`;
      
      setGeneratedContent(content);
      setContentTitle(`Growth Opportunities: ${formData.growthFocus}`);
      setIsLoading(false);
      setShowContent(true);
      setShowPinsSidebar(true);
    }, 2500);
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

          <button className="generate-btn" onClick={generateGrowthOpportunities} disabled={isLoading}>
            Generate Opportunities
          </button>
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
          <div className="generated-content">
            {generatedContent.split(/[.!?]+/).map((sentence, index) => {
              if (sentence.trim()) {
                return (
                  <span 
                    key={index}
                    className="sentence" 
                    id={`sentence-${index}`}
                  >
                    {sentence.trim()}.
                  </span>
                );
              }
              return null;
            }).filter(Boolean).map((element, index) => (
              <React.Fragment key={index}>
                {element}
                {index < generatedContent.split(/[.!?]+/).filter(s => s.trim()).length - 1 ? ' ' : ''}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <PinsSidebar show={showPinsSidebar} onClose={() => setShowPinsSidebar(false)} />
    </Layout>
  );
};

export default GrowthGenerator;