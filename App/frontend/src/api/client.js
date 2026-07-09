/**
 * API Client — connects to the FastAPI backend running on :8000
 * For production, this base URL would come from an environment variable.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJSON(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = {
  getDistricts: () => fetchJSON('/api/districts'),
  
  getSchools: (district = null) =>
    fetchJSON(district ? `/api/schools?district=${encodeURIComponent(district)}` : '/api/schools'),
    
  getRecommendations: (district = null) =>
    fetchJSON(district ? `/api/recommendations?district=${encodeURIComponent(district)}` : '/api/recommendations'),
    
  getDashboard: (district = null) =>
    fetchJSON(district ? `/api/dashboard?district=${encodeURIComponent(district)}` : '/api/dashboard'),
    
  getAnalytics: (district = null) =>
    fetchJSON(district ? `/api/analytics?district=${encodeURIComponent(district)}` : '/api/analytics'),
    
  getInsights: (district = null) =>
    fetchJSON(district ? `/api/insights?district=${encodeURIComponent(district)}` : '/api/insights'),
    
  searchSchools: (q) =>
    fetchJSON(`/api/search?q=${encodeURIComponent(q)}`),
};
