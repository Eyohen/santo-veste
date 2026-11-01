// Single place that talks to the Santo Veste API.
// VITE_URL is the server origin (http://localhost:9000); every route lives under /api.

const ORIGIN = (import.meta.env.VITE_URL || 'http://localhost:9000').replace(/\/$/, '');
export const API_BASE = `${ORIGIN}/api`;

const TOKEN_KEY = 'sv-token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable: the session just won't persist */ }
};

export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.status = status;
    Object.assign(this, details); // field, sku, available
  }
}

/** JSON in, JSON out. Throws ApiError carrying the server's customer-facing message. */
export async function api(path, { method = 'GET', body, query, token = getToken() } = {}) {
  const qs = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()}`
    : '';
  let res;
  try {
    res = await fetch(`${API_BASE}${path}${qs}`, {
      method,
      headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || 'Something went wrong.', res.status, data);
  return data;
}

/** multipart upload (admin images). Returns { url }. */
export async function upload(path, file, token = getToken()) {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || 'Upload failed.', res.status, data);
  return data;
}
