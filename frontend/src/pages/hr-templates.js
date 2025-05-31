import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import PinsSidebar from '../components/PinsSidebar';
import SentenceDisplay from '../components/SentenceDisplay';

const HRTemplates = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    templateType: 'job-description',
    field1: '',
    field2: 'Marketing',
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

  const generateHRTemplate = async () => {
    setIsLoading(true);
    setShowContent(false);
    
    // Simulate API call with fallback content
    setTimeout(() => {
      const content = `JOB DESCRIPTION

${formData.field1 || 'Senior Marketing Manager'}
${formData.field2} Department | Full-time

ABOUT THE ROLE

We're looking for a dynamic ${formData.field1 || 'Senior Marketing Manager'} to join our growing ${formData.field2.toLowerCase()} team at Staedtler. This role is perfect for someone who thrives in our collaborative, innovation-driven culture and wants to make a meaningful impact on our mission of empowering creativity through precision tools for artists and professionals worldwide. As our ${formData.field1 || 'Senior Marketing Manager'}, you'll be at the forefront of driving strategic initiatives that align with our core values of precision, reliability, and timeless innovation. You'll work closely with cross-functional teams to deliver results that matter, while enjoying the flexibility of our hybrid work environment.

KEY RESPONSIBILITIES

${formData.field3 || '• Lead strategic planning and execution for marketing initiatives that drive measurable business growth\n• Collaborate with product, sales, and customer success teams to ensure cohesive brand messaging\n• Develop and implement data-driven strategies that align with our company\'s focus on quality and innovation\n• Mentor junior team members and contribute to our culture of continuous learning and excellence'}

WHAT WE'RE LOOKING FOR

Experience & Skills:
• 3-5 years of relevant experience in ${formData.field2.toLowerCase()} or related field
• Proven track record of delivering results in fast-paced, growth-oriented environments
• Strong analytical skills with experience in data-driven decision making
• Excellent communication and presentation skills

Cultural Fit:
• Passion for quality craftsmanship and attention to detail (just like our pencils!)
• Collaborative mindset with a drive for continuous improvement
• Adaptability and resilience in a dynamic startup environment
• Alignment with our values of precision, reliability, and innovation

WHAT WE OFFER

• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Flexible PTO and professional development budget
• Top-of-the-line equipment and tools (including our premium writing instruments!)
• Collaborative workspace designed for creativity and focus

Ready to join a team that values precision, creativity, and making a lasting impact? We'd love to hear from you.`;
      
      setGeneratedContent(content);
      setContentTitle(`Job Description: ${formData.field1 || 'Senior Marketing Manager'}`);
      setIsLoading(false);
      setShowContent(true);
      setShowPinsSidebar(true);
    }, 2000);
  };

  return (
    <Layout title="HR Templates | Up, Up, Down, Down">
      <div className="page-header">
        <h1 className="page-title">👥 HR Templates</h1>
        <p className="page-subtitle">Create professional HR documents powered by your company culture and brand voice</p>
        <div className="ai-assist-btn">
          🤖 AI Assistant Ready
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
            <input 
              type="text" 
              name="field1"
              value={formData.field1}
              onChange={handleInputChange}
              placeholder="e.g., Senior Marketing Manager"
            />
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
            </select>
          </div>

          <div className="input-field">
            <label htmlFor="field3">Key Responsibilities</label>
            <textarea 
              name="field3"
              value={formData.field3}
              onChange={handleInputChange}
              placeholder="Describe main responsibilities and requirements..."
            />
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
      
      <style jsx>{`
        .ai-assist-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </Layout>
  );
};

export default HRTemplates;