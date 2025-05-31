import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';

const LegalTemplates = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    templateType: 'nda',
    field1: '',
    field2: 'Mutual/Bilateral',
    field3: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [showPinsSidebar, setShowPinsSidebar] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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

  const generateLegalTemplate = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    // Simulate API call with fallback content
    setTimeout(() => {
      const content = `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into between Staedtler Pencils Company ("Disclosing Party") and ${formData.field1 || 'ABC Creative Agency'} ("Receiving Party").

RECITALS

WHEREAS, the parties wish to engage in discussions regarding potential business opportunities that may require the disclosure of confidential and proprietary information;

WHEREAS, both parties desire to protect the confidentiality of such information;

NOW, THEREFORE, the parties agree as follows:

1. CONFIDENTIAL INFORMATION

For purposes of this Agreement, "Confidential Information" means all information disclosed by Staedtler, including but not limited to:

${formData.field3 || '• Business plans, strategies, and financial information\n• Product designs, manufacturing processes, and technical specifications\n• Customer lists, pricing information, and market research\n• Trade secrets, formulations, and proprietary manufacturing techniques\n• Any other information marked as confidential or that would reasonably be considered confidential'}

2. OBLIGATIONS OF RECEIVING PARTY

The Receiving Party agrees to:
• Maintain strict confidentiality of all Confidential Information
• Use Confidential Information solely for the purpose of evaluating potential business opportunities
• Not disclose Confidential Information to any third parties without prior written consent
• Take reasonable precautions to protect the confidentiality of all disclosed information
• Return or destroy all Confidential Information upon request or termination of discussions

3. TERM AND DURATION

This Agreement shall remain in effect for a period of three (3) years from the date of execution, unless terminated earlier by mutual written agreement of the parties.

4. REMEDIES

The parties acknowledge that any breach of this Agreement may cause irreparable harm to the Disclosing Party, and that monetary damages may be inadequate. Therefore, the Disclosing Party shall be entitled to seek injunctive relief and other equitable remedies in addition to any other available legal remedies.

5. GENERAL PROVISIONS

This Agreement shall be governed by the laws of [State] and any disputes shall be resolved through binding arbitration. This Agreement constitutes the entire understanding between the parties regarding the subject matter herein.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date last signed below.

STAEDTLER PENCILS COMPANY          ${(formData.field1 || 'ABC CREATIVE AGENCY').toUpperCase()}

_________________________          _________________________
Signature                          Signature

_________________________          _________________________
Date                              Date

IMPORTANT: This template is for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney before using this agreement.`;
      
      setGeneratedContent(content);
      setContentTitle(`Non-Disclosure Agreement: ${formData.field1 || 'ABC Creative Agency'}`);
      setIsLoading(false);
      setShowContent(true);
      setShowPinsSidebar(true);
    }, 2500);
  };

  return (
    <Layout title="Legal Templates | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">⚖️ Legal Templates</h1>
        <p className="page-subtitle">Create legal documents and analyze existing contracts with AI assistance</p>
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
            <input 
              type="text" 
              name="field1"
              value={formData.field1}
              onChange={handleInputChange}
              placeholder="Company or individual name"
            />
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
            </select>
          </div>

          <div className="input-field">
            <label htmlFor="field3">Specific Terms</label>
            <textarea 
              name="field3"
              value={formData.field3}
              onChange={handleInputChange}
              placeholder="Describe specific terms, scope, or requirements..."
            />
          </div>

          <button className="generate-btn" onClick={generateLegalTemplate} disabled={isLoading}>
            Generate Template
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading show">
          <div className="spinner"></div>
          <div>Creating legal document with compliance considerations...</div>
        </div>
      )}

      {showContent && (
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
    </Layout>
  );
};

export default LegalTemplates;