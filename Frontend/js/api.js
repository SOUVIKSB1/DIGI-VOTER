/**
 * VoteVision AI API Client
 * Centralized HTTP request client for /api/v1 endpoints.
 */
const API_BASE = `${window.location.origin}/api/v1`;

const API = {
  async get(endpoint, params = {}) {
    try {
      const url = new URL(`${API_BASE}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
          url.searchParams.append(key, params[key]);
        }
      });
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[API GET ${endpoint} Error]:`, err);
      return null;
    }
  },

  async post(endpoint, body = {}) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[API POST ${endpoint} Error]:`, err);
      return null;
    }
  },

  // Specific API calls
  getOverview: () => API.get("/analytics"),
  getStates: () => API.get("/states"),
  getStateDetail: (state) => API.get(`/states/${encodeURIComponent(state)}`),
  getConstituencies: (params) => API.get("/constituencies", params),
  getConstituency: (id) => API.get(`/constituencies/${encodeURIComponent(id)}`),
  getPrediction: (id, swing = 0.0) => API.get(`/predictions/${encodeURIComponent(id)}`, { swing }),
  getClosestRaces: (limit = 15) => API.get("/predictions/closest-races", { limit }),
  getTopBattlegrounds: (state = null) => API.get("/predictions/top-battlegrounds", { state }),
  simulateSwing: (swing_pct, target_alliance) => API.post("/predictions/simulate", { swing_pct, target_alliance }),
  getCandidates: (params) => API.get("/candidates", params),
  getCandidate: (id) => API.get(`/candidates/${encodeURIComponent(id)}`),
  compareCandidates: (c1, c2) => API.get("/candidates/compare", { c1, c2 }),
  getParties: (alliance = null) => API.get("/parties", { alliance }),
  getParty: (code) => API.get(`/parties/${encodeURIComponent(code)}`),
  getModelMetrics: () => API.get("/model/metrics"),
  queryAIAnalyst: (query) => API.post("/ai/query", { query }),
  getScenarios: () => API.get("/scenarios")
};
