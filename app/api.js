// make.fun's public API: read-only GET requests, open to any origin (CORS).
// Answers are cached and revalidated with ETag / If-None-Match: the API binds
// its ETags to the minute, so a revisit inside the same minute answers 304.
// A request that hangs is abandoned after 15 seconds so the page can show its
// error state instead of spinning forever.

const API = 'https://make.fun/api';

/** path -> { etag, body, at } */
const cache = new Map();

export async function get(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < 60000) return hit.body;
  const headers = {};
  if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
  const res = await fetch(API + path, { headers, signal: AbortSignal.timeout(15000) });
  if (res.status === 304 && hit) {
    hit.at = Date.now();
    return hit.body;
  }
  if (res.status === 304) throw new Error('make.fun API answered 304 with nothing cached');
  if (!res.ok) throw new Error('make.fun API answered ' + res.status);
  const body = await res.json();
  cache.set(path, { etag: res.headers.get('ETag'), body, at: Date.now() });
  return body;
}

/** The open bounties, one page: { items, next_cursor }. */
export const getBounties = (cursor) =>
  get('/competitions?status=open&activity=times&limit=50' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));

/** One bounty, by its slug. */
export const getBounty = (slug) => get('/competitions/' + encodeURIComponent(slug));

/** A bounty's leaderboard: { competition, phase, columns, entries }. */
export const getLeaderboard = (slug) => get('/competitions/' + encodeURIComponent(slug) + '/leaderboard');

/** An account's public profile, by its handle. */
export const getProfile = (handle) => get('/profiles/' + encodeURIComponent(handle));
