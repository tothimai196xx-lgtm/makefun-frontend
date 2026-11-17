// Read-only client for make.fun's public API.
// One origin only: https://make.fun/api. Responses are cached in memory and
// revalidated with ETags, which the API binds to the minute, so repeat visits
// cost a 304 instead of a full download. A view never fetches the same URL
// twice within a minute unless the caller forces it.

export const API_ORIGIN = 'https://make.fun';
export const API_BASE = API_ORIGIN + '/api';

const cache = new Map(); // url -> { etag, data, at }
const inflight = new Map(); // url -> Promise
const FRESH_MS = 60_000;
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(status, message) {
    super(message || ('Request failed' + (status ? ' (' + status + ')' : '')));
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * GET a JSON resource, revalidating the cached copy with If-None-Match.
 * @param {string} path - path under /api, e.g. "/competitions?status=open"
 * @param {{force?: boolean}} [opts]
 */
export async function getJson(path, opts = {}) {
  const url = API_BASE + path;
  const now = Date.now();
  const hit = cache.get(url);

  if (!opts.force && hit && now - hit.at < FRESH_MS) return hit.data;
  if (inflight.has(url)) return inflight.get(url);

  const job = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const headers = { accept: 'application/json' };
      if (hit?.etag) headers['if-none-match'] = hit.etag;
      const res = await fetch(url, { signal: ctrl.signal, headers, credentials: 'omit' });
      if (res.status === 304 && hit) {
        hit.at = Date.now();
        return hit.data;
      }
      if (!res.ok) {
        let detail = '';
        try {
          const body = await res.json();
          detail = body?.error?.message || body?.message || body?.detail || '';
        } catch { /* keep the status */ }
        throw new ApiError(res.status, detail || ('make.fun answered ' + res.status));
      }
      const data = await res.json();
      cache.set(url, { etag: res.headers.get('etag'), data, at: Date.now() });
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') {
        throw new ApiError(0, 'make.fun took too long to answer (15s). Check your connection and try again.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
      inflight.delete(url);
    }
  })();

  inflight.set(url, job);
  return job;
}

/** Drop every cached entry (used after a manual refresh). */
export function clearCache() {
  cache.clear();
}

/** Absolute URL for an image the API points at (avatars, entry media). */
export function apiImage(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return API_ORIGIN + (path.startsWith('/') ? path : '/' + path);
}
