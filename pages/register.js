import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
    subdomain: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate subdomain from tenant name
    if (name === 'tenantName') {
      const subdomain = value.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({
        ...prev,
        subdomain: subdomain
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (!formData.tenantName.trim()) {
      setErrorMessage('Company name is required');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);
      
      // Show success message
      alert('Registration successful! Please check your email to verify your account, then you can log in.');
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMsg = error.message || 'Registration failed. Please try again.';
      
      // Check if it's a "user already exists" error
      if (errorMsg.includes('User already registered') || errorMsg.includes('already been registered')) {
        setShowRecovery(true);
        setErrorMessage('An account with this email already exists but may be incomplete.');
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Recovery failed');
      }

      if (data.hasUserRecord) {
        alert('Your account is properly set up. Try logging in.');
        router.push('/login');
      } else {
        alert('Incomplete registration cleaned up. You can now register again.');
        setShowRecovery(false);
        // Allow user to try registration again
      }
    } catch (error) {
      console.error('Recovery error:', error);
      setErrorMessage(error.message || 'Recovery failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Register | Up, Up, Down, Down">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Your Account</h1>
            <p>Start your AI-powered business platform today</p>
          </div>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
              {showRecovery && (
                <div style={{ marginTop: '12px' }}>
                  <button 
                    type="button" 
                    onClick={handleRecovery}
                    disabled={isLoading}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Fixing...' : 'Fix Incomplete Registration'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="John"
                />
              </div>
              <div className="input-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="john@company.com"
              />
            </div>

            <div className="input-group">
              <label htmlFor="tenantName">Company Name</label>
              <input
                type="text"
                id="tenantName"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleInputChange}
                required
                placeholder="Your Company Inc."
              />
            </div>

            <div className="input-group">
              <label htmlFor="subdomain">Subdomain</label>
              <div className="subdomain-input">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleInputChange}
                  required
                  placeholder="your-company"
                />
                <span className="subdomain-suffix">.upup.app</span>
              </div>
              <small>This will be your unique URL</small>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  minLength="6"
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  minLength="6"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link href="/login">Sign in</Link></p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .auth-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 600px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-header h1 {
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .auth-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group label {
          color: #374151;
          font-weight: 500;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .input-group input {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .subdomain-input {
          display: flex;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
        }

        .subdomain-input input {
          border: none;
          flex: 1;
          padding: 12px 16px;
          font-size: 16px;
        }

        .subdomain-input input:focus {
          outline: none;
        }

        .subdomain-suffix {
          background: #f9fafb;
          padding: 12px 16px;
          color: #6b7280;
          font-size: 16px;
          border-left: 1px solid #d1d5db;
        }

        .input-group small {
          color: #6b7280;
          font-size: 12px;
          margin-top: 4px;
        }

        .auth-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 8px;
        }

        .auth-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .auth-footer p {
          color: #6b7280;
          font-size: 14px;
        }

        .auth-footer a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .auth-card {
            padding: 24px;
            margin: 10px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .auth-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Register;