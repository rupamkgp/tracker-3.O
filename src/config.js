export const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

// For Vercel production or Capacitor, use the absolute URL. 
// For local development in browser, use empty string to hit Vite proxy.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !isCapacitor
    ? '' 
    : 'https://tracker-3-o.vercel.app');
