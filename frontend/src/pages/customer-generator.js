import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';

const CustomerGenerator = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    connectionGoal: 'Improve Retention',
    customerSegment: '',
    currentChallenges: '',
    otherConnectionGoal: ''
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
      customerSegment: ['Professional Artists & Designers', 'Design Students & Educators', 'Creative Agencies & Studios', 'Technical Illustrators', 'Hobbyist Creators', 'Architecture Firms', 'Fashion Designers', 'Product Designers'],
      currentChallenges: ['High customer acquisition costs', 'Seasonal sales variations', 'Competition from digital tools', 'Retail partner relationships', 'Brand awareness in new markets'],
      otherConnectionGoal: ['Build Brand Loyalty', 'Increase Purchase Frequency', 'Reduce Churn Rate', 'Expand Market Share', 'Enhance Customer Experience']
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

  const generateCustomerConnection = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    try {
      const { apiRequest, apiConfig } = await import('../utils/api-config');
      
      const response = await apiRequest(apiConfig.endpoints.content.generateCustomer, {
        method: 'POST',
        body: JSON.stringify({
          connectionGoal: formData.connectionGoal,
          customerSegment: formData.customerSegment,
          currentChallenges: formData.currentChallenges || 'General customer relationship challenges'
        })
      });
      
      if (response.success) {
        setGeneratedContent(response.data.content);
        setContentTitle(response.data.title);
        setShowContent(true);
        setShowPinsSidebar(true);
      } else {
        throw new Error(response.message || 'Failed to generate customer connection strategies');
      }
    } catch (error) {
      console.error('Customer connection generation error:', error);
      
      // Fallback content
      const fallbackContent = `Professional customers value consistency and reliability above all else in their relationships with premium brands, making retention strategies focus on delivering predictable quality and performance with every interaction. These customers develop deep emotional connections to brands that help them achieve their best work, transforming functional purchases into long-term loyalty that extends across entire product lines. The key to improving retention lies in understanding that professionals view premium products as extensions of their professional identity, not just disposable supplies. Regular communication that provides industry insights, technique tips, and professional spotlights builds community while keeping your brand top-of-mind during the long intervals between purchases. Professional customers appreciate being recognized for their expertise and achievements, creating opportunities to feature customer work and success stories in marketing materials and communications. The most effective retention strategy involves creating exclusive access to new products, special editions, and behind-the-scenes content that makes customers feel like insiders rather than just buyers. Customers respond positively to educational content that helps them improve their skills, positioning your brand as a partner in their professional journey rather than just a supplier. Quality assurance programs that guarantee product consistency and offer immediate support for any issues build trust and reduce switching to competitive brands. Timing communications around typical professional cycles and seasonal patterns ensures your messages arrive when customers are most receptive and likely to make purchasing decisions. The most successful retention approaches acknowledge that professional customers are running businesses themselves, so communications should respect their time while providing genuine value that supports their professional success and growth.`;
      
      setGeneratedContent(fallbackContent);
      setContentTitle(`Customer Strategy: ${formData.connectionGoal}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      
      alert('Customer strategies generated using fallback mode. Please check your internet connection or contact support if this persists.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Customer Connection | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">💬 Customer Connection</h1>
        <p className="page-subtitle">Develop deeper customer relationships through better engagement strategies</p>
      </div>

      <div className="generator-header">
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="connectionGoal">Connection Goal</label>
            <select 
              name="connectionGoal"
              value={formData.connectionGoal}
              onChange={handleInputChange}
            >
              <option>Improve Retention</option>
              <option>Increase Engagement</option>
              <option>Recover At-Risk Customers</option>
              <option>Upsell/Cross-sell</option>
              <option>Build Community</option>
              <option value="other">Other (specify)</option>
            </select>
            {formData.connectionGoal === 'other' && (
              <div className="other-input show">
                <div className="input-with-ai">
                  <input 
                    type="text" 
                    name="otherConnectionGoal"
                    value={formData.otherConnectionGoal}
                    onChange={handleInputChange}
                    placeholder="Please specify your connection goal..."
                  />
                  <button 
                    className="ai-assist-btn" 
                    onClick={() => aiAssist('otherConnectionGoal')}
                    type="button"
                  >
                    AI Assist
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="customerSegment">Customer Segment</label>
            <div className="input-with-ai">
              <input 
                type="text"
                name="customerSegment"
                value={formData.customerSegment}
                onChange={handleInputChange}
                placeholder="e.g., Professional Artists & Designers, Creative Agencies"
              />
              <button 
                className="ai-assist-btn" 
                onClick={() => aiAssist('customerSegment')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <div className="input-field">
            <label htmlFor="currentChallenges">Current Challenges</label>
            <div className="input-with-ai">
              <textarea 
                name="currentChallenges"
                value={formData.currentChallenges}
                onChange={handleInputChange}
                placeholder="Describe specific customer relationship issues..."
              />
              <button 
                className="ai-assist-btn" 
                style={{top: '20px'}}
                onClick={() => aiAssist('currentChallenges')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <button className="generate-btn" onClick={generateCustomerConnection} disabled={isLoading}>
            Generate Strategies
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Analyzing customer psychology and engagement opportunities...</div>
        </div>
      )}

      {showContent && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent}
            title={contentTitle}
            sourceType="customer"
          />
        </div>
      )}

      <PinsSidebar show={showPinsSidebar} onClose={() => setShowPinsSidebar(false)} />
    </Layout>
  );
};

export default CustomerGenerator;