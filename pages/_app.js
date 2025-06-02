import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { PinsProvider } from '../contexts/PinsContext';
import '../styles/globals.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>The application encountered an error. Please refresh the page.</p>
          <details style={{ marginTop: '20px' }}>
            <summary>Error details</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '10px 20px', 
              marginTop: '20px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PinsProvider>
          <Component {...pageProps} />
        </PinsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;