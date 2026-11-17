// Small formatting helpers. Everything here is pure: no DOM, no network.

/** "$1,234.56" — money always shows two decimals, like the site does. */
export function usd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Whole dollars with no cents, for pots and rewards on the board. */
export function usd0(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** "12,345" with thousands separators. */
export function num(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US');
}

/** Win rate stored as micro units (944244 = 94.4244%) -> "94.42%". */
export function winRate(micro) {
  const n = Number(micro);
  if (!Number.isFinite(n)) return '—';
  return (n / 10000).toFixed(2) + '%';
}

/** "914 KB" / "1.46 MB" for dossier sizes. */
export function bytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (v < 1024) return v + ' B';
  if (v < 1024 * 1024) return (v / 1024).toFixed(v % 1024 === 0 ? 0 : 1) + ' KB';
  return (v / (1024 * 1024)).toFixed(2) + ' MB';
}

/** "Nov 17, 2026, 12:30 PM UTC" — always UTC, so everyone reads the same time. */
export function dateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let h = d.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${h}:${min} ${ampm} UTC`;
}

/** "Nov 17, 2026" — short date for joined / published lines. */
export function dateShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Time left until a deadline: "8h 28m left", "1d 13h left", "45m left".
 * Past deadlines read "closed" with how long ago they ended.
 */
export function timeLeft(deadlineIso, now = Date.now()) {
  const end = new Date(deadlineIso).getTime();
  if (Number.isNaN(end)) return '—';
  let diff = end - now;
  const past = diff < 0;
  diff = Math.abs(diff);
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rem = mins % 60;
  let text;
  if (days > 0) text = `${days}d ${hours}h`;
  else if (hours > 0) text = `${hours}h ${rem}m`;
  else text = `${rem}m`;
  return past ? `ended ${text} ago` : `${text} left`;
}

/** "1d 13h left" is the short form; this is true while a bounty still takes entries. */
export function stillOpen(deadlineIso, now = Date.now()) {
  const end = new Date(deadlineIso).getTime();
  return Number.isFinite(end) && end > now;
}

/** Escape text for insertion into HTML. Never interpolate raw API strings. */
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
