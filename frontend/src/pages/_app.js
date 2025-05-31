import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { PinsProvider } from '../contexts/PinsContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <PinsProvider>
        <Component {...pageProps} />
      </PinsProvider>
    </AuthProvider>
  );
}

export default MyApp;