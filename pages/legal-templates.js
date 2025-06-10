import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';
import { useUsageTracking } from '../hooks/useUsageTracking';

const LegalTemplates = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { trackTemplateUsed } = useUsageTracking();
  const [formData, setFormData] = useState({
    templateType: 'nda',
    field1: '',
    field2: 'Mutual/Bilateral',
    field3: '',
    otherField2: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [showPinsSidebar, setShowPinsSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentText, setDocumentText] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedDocument, setAnalyzedDocument] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

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

  const aiAssist = (fieldName) => {
    const suggestions = {
      field1: ['Creative Design Agency', 'Tech Startup Inc.', 'Marketing Solutions LLC', 'Global Consulting Group', 'Digital Media Company'],
      field3: ['• Business plans, strategies, and financial information\n• Product designs, manufacturing processes, and technical specifications\n• Customer lists, pricing information, and market research\n• Trade secrets, formulations, and proprietary techniques', '• Software code, algorithms, and technical documentation\n• Marketing strategies, campaigns, and customer insights\n• Vendor relationships, supplier information, and pricing models\n• Employee data, compensation structures, and organizational charts'],
      otherField2: ['Vendor NDA', 'Partnership NDA', 'Investor NDA', 'Board Member NDA', 'Advisory NDA']
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

  const generateLegalTemplate = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    try {
      // Import the API helper to get auth headers
      const { apiRequest } = await import('../utils/api-config');
      
      const data = await apiRequest('/content/templates/legal', {
        method: 'POST',
        body: JSON.stringify({
          templateType: formData.templateType,
          partyName: formData.field1,
          projectDetails: formData.field2,
          specificTerms: formData.field3
        })
      });
      
      setGeneratedContent(data.data?.content || data.content);
      setContentTitle(data.data?.title || `Legal Document: ${formData.templateType}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      trackTemplateUsed(formData.templateType, 1000);
    } catch (error) {
      console.error('Error generating legal template:', error);
      // Fallback content on error
      const fallbackContent = `${formData.templateType} document for ${formData.field1 || 'Party'}. Project: ${formData.field2 || 'Business Relationship'}. Specific terms: ${formData.field3 || 'Standard terms apply'}.

IMPORTANT: This template is for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney before using this agreement.`;
      setGeneratedContent(fallbackContent);
      setContentTitle(`Legal Document: ${formData.templateType}`);
      setShowContent(true);
      setShowPinsSidebar(true);
      trackTemplateUsed(formData.templateType, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      // For demo purposes, we'll simulate reading the file
      // In a real implementation, you'd use FileReader API for text files
      // or send to backend for PDF/DOC processing
    }
  };

  const analyzeDocument = async () => {
    setIsAnalyzing(true);
    setAiReview('');
    setAnalyzedDocument(null);
    setShowChat(false);
    setChatHistory([]);
    
    try {
      const { apiRequest } = await import('../utils/api-config');
      
      let result;
      
      if (uploadedFile) {
        // Handle file upload
        const formData = new FormData();
        formData.append('document', uploadedFile);
        
        result = await apiRequest('/content/analyze-document', {
          method: 'POST',
          body: formData,
          isFormData: true
        });
      } else if (documentText.trim()) {
        // Handle text analysis
        result = await apiRequest('/content/analyze-document', {
          method: 'POST',
          body: JSON.stringify({ text: documentText })
        });
      } else {
        throw new Error('No document or text provided for analysis');
      }
      
      if (result.success) {
        setAiReview(result.data.analysis);
        setAnalyzedDocument({
          text: result.data.documentText || documentText,
          source: result.data.source,
          analyzedAt: result.data.analyzedAt,
          isFile: !!uploadedFile
        });
        setShowPinsSidebar(true);
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('Error analyzing document:', error);
      setAiReview(`Error analyzing document: ${error.message}

Please try again or contact support if the issue persists.

⚠️ IMPORTANT DISCLAIMER: This AI analysis is for informational purposes only and does not constitute legal advice. Always consult with qualified legal counsel before executing any legal agreement.`);
      setShowPinsSidebar(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !analyzedDocument) {
      console.log('Cannot ask question - missing data:', { 
        hasQuestion: !!currentQuestion.trim(), 
        hasDocument: !!analyzedDocument 
      });
      return;
    }
    
    console.log('Asking question:', currentQuestion);
    setIsAsking(true);
    
    try {
      const { apiRequest } = await import('../utils/api-config');
      
      console.log('Sending request with data:', {
        question: currentQuestion,
        documentTextLength: analyzedDocument.text?.length,
        historyLength: chatHistory.length
      });
      
      const result = await apiRequest('/content/chat-document', {
        method: 'POST',
        body: JSON.stringify({
          question: currentQuestion,
          documentText: analyzedDocument.text,
          conversationHistory: chatHistory
        })
      });
      
      console.log('Chat API response:', result);
      
      if (result.success) {
        const newEntry = {
          question: currentQuestion,
          response: result.data.response,
          timestamp: result.data.timestamp
        };
        
        console.log('Adding new entry to chat:', newEntry);
        setChatHistory(prev => [...prev, newEntry]);
        setCurrentQuestion('');
      } else {
        console.error('Chat API returned error:', result);
        throw new Error(result.message || 'Failed to get response');
      }
      
    } catch (error) {
      console.error('Error asking question:', error);
      const errorEntry = {
        question: currentQuestion,
        response: `Sorry, I couldn't process your question: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorEntry]);
      setCurrentQuestion('');
    } finally {
      console.log('Setting isAsking to false');
      setIsAsking(false);
    }
  };

  return (
    <Layout title="Legal Templates | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">⚖️ Legal Templates</h1>
        <p className="page-subtitle">Create legal documents and analyze existing contracts with AI assistance</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📄 Create Templates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          🔍 Document Review
        </button>
      </div>

      <div style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '32px'
      }}>
        <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
          ⚠️ Important Legal Disclaimer
        </div>
        <div style={{ color: '#92400e', fontSize: '14px' }}>
          This AI analysis is for informational purposes only and does not constitute legal advice. 
          Always consult with a qualified attorney for legal matters.
        </div>
      </div>

      {activeTab === 'templates' && (
      <div className="generator-header">
        <div className="input-group">
          <div className="input-field">
            <label htmlFor="templateType">Template Type</label>
            <select 
              name="templateType"
              value={formData.templateType}
              onChange={handleInputChange}
            >
              <option value="nda">Non-Disclosure Agreement</option>
              <option value="service-agreement">Service Agreement</option>
              <option value="employment-contract">Employment Contract</option>
              <option value="vendor-agreement">Vendor Agreement</option>
              <option value="privacy-policy">Privacy Policy</option>
              <option value="terms-of-service">Terms of Service</option>
            </select>
          </div>

          <div className="input-field">
            <label htmlFor="field1">Other Party Name</label>
            <div className="input-with-ai">
              <input 
                type="text" 
                name="field1"
                value={formData.field1}
                onChange={handleInputChange}
                placeholder="Company or individual name"
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
            <label htmlFor="field2">Agreement Type</label>
            <select 
              name="field2"
              value={formData.field2}
              onChange={handleInputChange}
            >
              <option>Mutual/Bilateral</option>
              <option>One-way/Unilateral</option>
              <option>Employee NDA</option>
              <option>Contractor NDA</option>
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
                    placeholder="Please specify agreement type..."
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
            <label htmlFor="field3">Specific Terms</label>
            <div className="input-with-ai">
              <textarea 
                name="field3"
                value={formData.field3}
                onChange={handleInputChange}
                placeholder="Describe specific terms, scope, or requirements..."
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

          <button className="generate-btn" onClick={generateLegalTemplate} disabled={isLoading}>
            🤖 Generate Template with AI
          </button>
        </div>
      </div>
      )}

      {activeTab === 'review' && (
        <div className="document-review-section">
          <div className="upload-area">
            <h3>Upload Legal Document</h3>
            <div className="file-upload">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="document-upload"
              />
              <label htmlFor="document-upload" className="upload-label">
                📁 Choose Document (PDF, DOC, TXT)
              </label>
              {uploadedFile && (
                <div className="file-info">
                  ✅ {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          <div className="text-input-area">
            <h3>Or Paste Document Text</h3>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your legal document text here for AI analysis..."
              rows={8}
              className="document-textarea"
            />
            <button 
              className="generate-btn" 
              onClick={analyzeDocument} 
              disabled={isAnalyzing || (!uploadedFile && !documentText.trim())}
            >
              🤖 Analyze Document with AI
            </button>
          </div>

          {isAnalyzing && (
            <div className="loading show">
              <div className="spinner"></div>
              <div>Analyzing document for legal insights, risks, and recommendations...</div>
            </div>
          )}

          {aiReview && (
            <div className="content-container show">
              <div className="content-title">📋 AI Legal Document Review</div>
              <SentenceDisplay 
                content={aiReview}
                title="Legal Document Review"
                sourceType="legal-review"
              />
              
              {analyzedDocument && (
                <div className="chat-section">
                  <div className="chat-header">
                    <h3>💬 Chat with Document</h3>
                    <button 
                      className="toggle-chat-btn" 
                      onClick={() => setShowChat(!showChat)}
                    >
                      {showChat ? 'Hide Chat' : 'Ask Questions'}
                    </button>
                  </div>
                  
                  {showChat && (
                    <div className="chat-interface">
                      <div className="chat-history">
                        {chatHistory.map((entry, index) => (
                          <div key={index} className="chat-entry">
                            <div className="question">
                              <strong>Q:</strong> {entry.question}
                            </div>
                            <div className="response">
                              <strong>A:</strong> {entry.response}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="chat-input">
                        <div className="input-row">
                          <input
                            type="text"
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                            placeholder="Ask a question about this document..."
                            onKeyPress={(e) => e.key === 'Enter' && !isAsking && askQuestion()}
                            disabled={isAsking}
                          />
                          <button 
                            onClick={askQuestion} 
                            disabled={!currentQuestion.trim() || isAsking}
                            className="ask-btn"
                          >
                            {isAsking ? 'Asking...' : 'Ask'}
                          </button>
                        </div>
                        <div className="suggested-questions">
                          {['What are the key risks in this document?', 'What payment terms are specified?', 'How can this agreement be terminated?'].map((suggestion, index) => (
                            <button
                              key={index}
                              className="suggestion-btn"
                              onClick={() => setCurrentQuestion(suggestion)}
                              disabled={isAsking}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isLoading && activeTab === 'templates' && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Creating legal document with compliance considerations...</div>
        </div>
      )}

      {showContent && activeTab === 'templates' && (
        <div className="content-container show">
          <div className="content-title">{contentTitle}</div>
          <SentenceDisplay 
            content={generatedContent}
            title={contentTitle}
            sourceType="legal-template"
          />
        </div>
      )}

      <PinsSidebar show={showPinsSidebar} onClose={() => setShowPinsSidebar(false)} />
      
      <style jsx>{`
        .tab-navigation {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: white;
          padding: 4px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
        }

        .tab-btn.active {
          background: #10b981;
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .tab-btn:hover:not(.active) {
          background: #f1f5f9;
          color: #374151;
        }

        .document-review-section {
          display: grid;
          gap: 24px;
        }

        .upload-area, .text-input-area {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .upload-area h3, .text-input-area h3 {
          margin: 0 0 16px 0;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .file-upload {
          text-align: center;
        }

        .upload-label {
          display: inline-block;
          padding: 16px 32px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          color: #475569;
        }

        .upload-label:hover {
          background: #f1f5f9;
          border-color: #10b981;
          color: #10b981;
        }

        .file-info {
          margin-top: 12px;
          padding: 8px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          color: #166534;
          font-size: 14px;
          font-weight: 500;
        }

        .document-textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          margin-bottom: 16px;
        }

        .document-textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .document-textarea::placeholder {
          color: #9ca3af;
          font-style: italic;
        }

        .chat-section {
          margin-top: 24px;
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chat-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .toggle-chat-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .toggle-chat-btn:hover {
          background: #2563eb;
        }

        .chat-interface {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
        }

        .chat-history {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .chat-entry {
          margin-bottom: 16px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .chat-entry .question {
          margin-bottom: 8px;
          color: #1e293b;
          font-size: 14px;
        }

        .chat-entry .response {
          color: #475569;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .chat-input {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }

        .input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .input-row input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .input-row input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .ask-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ask-btn:hover:not(:disabled) {
          background: #059669;
        }

        .ask-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .suggested-questions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .suggestion-btn {
          background: #e2e8f0;
          color: #475569;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .suggestion-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }

        .suggestion-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Analysis formatting styles */
        :global(.analysis-heading) {
          color: #1e293b;
          font-size: 18px;
          font-weight: 700;
          margin: 24px 0 12px 0;
          padding: 8px 0;
          border-bottom: 2px solid #e2e8f0;
        }

        :global(.analysis-bullet) {
          display: flex;
          align-items: flex-start;
          margin: 8px 0;
          padding-left: 8px;
        }

        :global(.bullet-icon) {
          color: #3b82f6;
          font-weight: bold;
          margin-right: 8px;
          min-width: 16px;
        }

        :global(.analysis-numbered) {
          margin: 8px 0;
          padding-left: 16px;
          color: #374151;
        }

        :global(.analysis-text) {
          margin: 6px 0;
          color: #374151;
          line-height: 1.6;
        }

        :global(.analysis-spacer) {
          height: 12px;
        }

        :global(.analysis-divider) {
          border: none;
          border-top: 1px solid #d1d5db;
          margin: 20px 0;
        }

        /* Override default generated-content styles for better analysis display */
        :global(.generated-content) {
          line-height: 1.6;
        }

        :global(.generated-content h2) {
          color: #1e293b;
          font-size: 18px;
          font-weight: 700;
          margin: 24px 0 12px 0;
          padding: 8px 0;
          border-bottom: 2px solid #e2e8f0;
        }
      `}</style>
    </Layout>
  );
};

export default LegalTemplates;