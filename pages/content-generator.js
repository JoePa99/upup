import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';

const ContentGenerator = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    contentTopic: '',
    contentType: 'Blog Post',
    contentAudience: '',
    otherContentType: ''
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

  const handleOtherOption = (selectValue) => {
    if (selectValue === 'other') {
      // Show other input field logic can be added here
    }
  };

  const aiAssist = (fieldName) => {
    const suggestions = {
      contentTopic: ['customer retention strategies', 'holiday marketing campaigns', 'brand storytelling', 'competitive differentiation', 'product launch strategy'],
      contentAudience: ['Professional artists and designers', 'Art students and educators', 'Creative agencies and studios', 'Art supply retailers', 'Corporate design teams']
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

  const generateContent = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentTopic: formData.contentTopic || 'customer retention',
          contentType: formData.contentType,
          contentAudience: formData.contentAudience || 'professional customers'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      setGeneratedContent(data.content);
      setContentTitle(data.title || `Strategic Content: ${formData.contentTopic || 'Customer Retention'}`);
      setShowContent(true);
      setShowPinsSidebar(true);
    } catch (error) {
      console.error('Content generation error:', error);
      
      // Fallback to mock content if API fails
      const fallbackContent = `Building authentic customer relationships starts with understanding that trust isn't built overnight—it's earned through consistent actions over time. Your customers are constantly evaluating whether your brand delivers on its promises, not just in your premium products, but in every interaction they have with your company. The most successful businesses recognize that customer trust is their most valuable asset, worth more than any short-term revenue boost from aggressive pricing tactics. When customers trust your brand, they become advocates who refer others, provide honest feedback about new products, and stick with you even when competitors offer cheaper alternatives. Modern consumers have access to unlimited information and options, which means they can easily spot inauthentic marketing messages from brands trying too hard to be trendy. The companies that thrive are those that speak honestly about their values and capabilities, rather than making unrealistic promises about instant success. Social proof through customer testimonials and case studies has become crucial, but only when it feels genuine rather than manufactured for marketing purposes. Your company's response to product issues often matters more than preventing every single problem, as it shows how you handle challenges and treat customers when things go wrong. Transparency in your processes and commitment to sustainable practices builds confidence and reduces the friction that causes customers to hesitate before making premium purchases. The most powerful trust-building strategy is to consistently deliver slightly more value than customers expect, creating positive surprises that they remember and share with others.`;
      
      setGeneratedContent(fallbackContent);
      setContentTitle(`Strategic Content: ${formData.contentTopic || 'Customer Retention'}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      
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
                className="ai-assist-btn" 
                onClick={() => aiAssist('contentTopic')}
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
                className="ai-assist-btn" 
                onClick={() => aiAssist('contentAudience')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <button className="generate-btn" onClick={generateContent} disabled={isLoading}>
            Generate Content
          </button>
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
    </Layout>
  );
};

export default ContentGenerator;