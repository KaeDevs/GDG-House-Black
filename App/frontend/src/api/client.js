/**
 * API Client — connects to the FastAPI backend running on :8000
 * For production, this base URL would come from an environment variable.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'https://gdg-house-black.onrender.com';

async function fetchJSON(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = {
  getSchools: () => fetchJSON('/api/schools'),
  getRecommendations: () => fetchJSON('/api/recommendations'),
};
