// API Configuration for UPUP Frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for AI generation
  
  // API Endpoints
  endpoints: {
    // Authentication
    auth: {
      login: '/tenant/auth/login',
      register: '/tenant/auth/register',
      logout: '/tenant/auth/logout',
      me: '/tenant/auth/me'
    },
    
    // Content Generation
    content: {
      generate: '/content/generate',
      generateGrowth: '/content/generate/growth',
      generateMarket: '/content/generate/market',
      generateCustomer: '/content/generate/customer'
    },
    
    // Templates
    templates: {
      hr: '/content/templates/hr',
      legal: '/content/templates/legal',
      sales: '/content/templates/sales'
    },
    
    // Pins Management
    pins: {
      create: '/content/pins',
      createFromPins: '/content/create-from-pins'
    },
    
    // AI Suggestions
    suggestions: '/content/suggestions',
    
    // Usage & Analytics
    usage: '/tenant/usage',
    
    // Tenant Management
    tenant: {
      info: '/tenant/info',
      settings: '/tenant/settings'
    }
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function for authenticated requests
export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API request helper with error handling
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  // Handle FormData (for file uploads) vs JSON
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData 
    ? getAuthHeaders() // Don't set Content-Type for FormData
    : {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

  const defaultOptions = {
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

export default apiConfig;