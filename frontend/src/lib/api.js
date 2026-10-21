export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const activeRequests = new Set();
export function cancelRequests() { activeRequests.forEach(controller => controller.abort()); }

export async function request(path, { token, body, timeout = 180000, ...options } = {}) {
  const controller = new AbortController();
  activeRequests.add(controller);
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = { ...options.headers };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  try {
    const response = await fetch(API + path, {
      ...options, headers, signal: controller.signal,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    let data;
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) {
      let message = data.detail;
      if (Array.isArray(message)) message = message.map(item => item.msg).join('. ');
      if (response.status === 401 && token) message = 'Your session has expired. Please sign in again.';
      if (response.status >= 500) message = 'The local server could not complete this request. Check that your Ollama model is ready, then try again.';
      throw new ApiError(typeof message === 'string' ? message : 'Something went wrong. Please try again.', response.status);
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('This is taking longer than expected. Your local model may still be loading. Please try again.', 408);
    if (error instanceof ApiError) throw error;
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  } finally { clearTimeout(timer); activeRequests.delete(controller); }
}

export function storageGet(key) {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
export function storageSet(key, value) {
  try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch { /* Session still works when browser storage is unavailable. */ }
}
