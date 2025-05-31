import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';

const MarketGenerator = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    analysisFocus: 'Customer Behavior',
    marketScope: 'Current Market',
    specificCompetitors: '',
    otherAnalysisFocus: '',
    otherMarketScope: ''
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
      specificCompetitors: ['Faber-Castell', 'Pilot Corporation', 'Prismacolor', 'Copic', 'Sakura'],
      otherAnalysisFocus: ['SWOT Analysis', 'Porter Five Forces', 'Market Segmentation', 'Value Chain Analysis', 'Competitive Benchmarking'],
      otherMarketScope: ['Vertical Markets', 'Niche Segments', 'Emerging Markets', 'B2B vs B2C', 'Online vs Offline']
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

  const generateMarketInsights = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    try {
      const { apiRequest, apiConfig } = await import('../utils/api-config');
      
      const response = await apiRequest(apiConfig.endpoints.content.generateMarket, {
        method: 'POST',
        body: JSON.stringify({
          analysisFocus: formData.analysisFocus,
          marketScope: formData.marketScope,
          specificCompetitors: formData.specificCompetitors || 'general competitors'
        })
      });
      
      if (response.success) {
        setGeneratedContent(response.data.content);
        setContentTitle(response.data.title);
        setShowContent(true);
        setShowPinsSidebar(true);
      } else {
        throw new Error(response.message || 'Failed to generate market insights');
      }
    } catch (error) {
      console.error('Market insights generation error:', error);
      
      // Fallback content
      const fallbackContent = `Customer behavior in the premium market reveals a fundamental shift toward quality-over-quantity purchasing decisions, particularly among professionals who view tools as investments in their success. Today's customers research extensively before making purchases, often spending weeks evaluating options and reading reviews from peers before committing to premium brands. The decision-making process is heavily influenced by recommendations and social proof, with professional networks being the primary source of purchase influence. Price sensitivity decreases significantly when customers understand the connection between quality and outcomes, making education and demonstration crucial for converting prospects to premium purchases. Younger professionals show strong preference for brands with authentic heritage stories and sustainable practices, creating opportunities for companies with genuine narratives to resonate beyond just product quality. The rise of digital tools hasn't diminished demand for quality traditional products—instead, it's created a more discerning customer base that values authentic experiences as supplements to digital work. Professional customers exhibit strong brand loyalty once they find products that consistently meet their requirements, with repeat purchase rates being significantly higher for satisfied premium customers. The buying journey increasingly starts online even for offline purchases, with customers researching specifications, watching demonstrations, and comparing products before visiting physical locations. Professional customers value detailed product information and technical specifications more than lifestyle marketing, preferring to understand exactly how products will perform in their specific applications. Purchase timing often aligns with project cycles and seasonal patterns, creating predictable demand that smart inventory management can capitalize on for improved margins and customer satisfaction.`;
      
      setGeneratedContent(fallbackContent);
      setContentTitle(`Market Analysis: ${formData.analysisFocus}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      
      alert('Market insights generated using fallback mode. Please check your internet connection or contact support if this persists.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Market Insights | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">🎯 Market Insights</h1>
        <p className="page-subtitle">Understand market dynamics and competitive landscape for strategic decisions</p>
      </div>

      <div className="generator-header">
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="analysisFocus">Analysis Focus</label>
            <select 
              name="analysisFocus"
              value={formData.analysisFocus}
              onChange={handleInputChange}
            >
              <option>Customer Behavior</option>
              <option>Competitive Landscape</option>
              <option>Market Trends</option>
              <option>Industry Analysis</option>
              <option>Pricing Strategy</option>
              <option value="other">Other (specify)</option>
            </select>
            {formData.analysisFocus === 'other' && (
              <div className="other-input show">
                <div className="input-with-ai">
                  <input 
                    type="text" 
                    name="otherAnalysisFocus"
                    value={formData.otherAnalysisFocus}
                    onChange={handleInputChange}
                    placeholder="Please specify analysis focus..."
                  />
                  <button 
                    className="ai-assist-btn" 
                    onClick={() => aiAssist('otherAnalysisFocus')}
                    type="button"
                  >
                    AI Assist
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="input-field">
            <label htmlFor="marketScope">Market Scope</label>
            <select 
              name="marketScope"
              value={formData.marketScope}
              onChange={handleInputChange}
            >
              <option>Current Market</option>
              <option>Adjacent Markets</option>
              <option>New Market Entry</option>
              <option>Global Expansion</option>
              <option value="other">Other (specify)</option>
            </select>
            {formData.marketScope === 'other' && (
              <div className="other-input show">
                <div className="input-with-ai">
                  <input 
                    type="text" 
                    name="otherMarketScope"
                    value={formData.otherMarketScope}
                    onChange={handleInputChange}
                    placeholder="Please specify market scope..."
                  />
                  <button 
                    className="ai-assist-btn" 
                    onClick={() => aiAssist('otherMarketScope')}
                    type="button"
                  >
                    AI Assist
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="input-field">
            <label htmlFor="specificCompetitors">Specific Competitors</label>
            <div className="input-with-ai">
              <input 
                type="text" 
                name="specificCompetitors"
                value={formData.specificCompetitors}
                onChange={handleInputChange}
                placeholder="Faber-Castell, Pilot, Prismacolor..."
              />
              <button 
                className="ai-assist-btn" 
                onClick={() => aiAssist('specificCompetitors')}
                type="button"
              >
                AI Assist
              </button>
            </div>
          </div>

          <button className="generate-btn" onClick={generateMarketInsights} disabled={isLoading}>
            Generate Insights
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Processing market data and competitive intelligence...</div>
        </div>
      )}

      {showContent && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent}
            title={contentTitle}
            sourceType="market"
          />
        </div>
      )}

      <PinsSidebar show={showPinsSidebar} onClose={() => setShowPinsSidebar(false)} />
    </Layout>
  );
};

export default MarketGenerator;