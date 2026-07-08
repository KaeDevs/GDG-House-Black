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
  /** Returns list of available districts: [{ id, name, state, center, zoom }] */
  getDistricts: () => fetchJSON('/api/districts'),

  /** Returns schools (+ stats) filtered by district. district = null → all districts */
  getSchools: (district = null) =>
    fetchJSON(district ? `/api/schools?district=${encodeURIComponent(district)}` : '/api/schools'),

  /** Returns recommendations filtered by district. district = null → all districts */
  getRecommendations: (district = null) =>
    fetchJSON(district ? `/api/recommendations?district=${encodeURIComponent(district)}` : '/api/recommendations'),
};
