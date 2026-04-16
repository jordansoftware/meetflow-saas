const API_BASE = '/api';

export const api = {
  fetch: async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if ((response.status === 401 || response.status === 403) && !endpoint.includes('/public/')) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/' && !window.location.pathname.startsWith('/u/')) {
         window.location.href = '/login';
      }
    }

    let data;
    try {
      data = await response.clone().json();
    } catch (e) {
      // Not JSON
    }

    if (!response.ok) {
      throw new Error((data && data.error) ? data.error : response.statusText || 'An error occurred');
    }

    return response.json();
  }
};
