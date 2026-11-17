// A make.fun frontend: the board, a bounty page, its leaderboard and a public
// profile, on hash routes. Loaded after the first paint by main.js (a literal
// import()), so the first load stays tiny. Read-only: it only GETs make.fun's
// public API.
//
//   #/                              the board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     its leaderboard
//   #/u/<handle>                    an account's public profile
//
// window.__shotReady is false while a page loads and true once its data is on
// screen, so a screenshot script knows when to capture.

import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { boardView } from './views-board.js';
import { esc, timeLeft } from './format.js';

/** The bounty, leaderboard and profile views load after the first load, so the
 * first load stays small: one literal import(), fetched once and cached. */
let detail = null;
async function loadDetail() {
  if (!detail) detail = await import('./views-detail.js');
  return detail;
}

const app = document.getElementById('app');
const lookup = document.getElementById('lookup');

/** Board filter state, kept while the page lives. */
const ui = { q: '', cat: '', sort: 'ending', openOnly: true, cats: [] };
let boardItems = [];
let boardCursor = null;
let shown = 100;

function route() {
  const h = location.hash || '#/';
  let m;
  if ((m = h.match(/^#\/bounty\/([^/]+)\/leaderboard\/?$/))) return { name: 'leaderboard', slug: decodeURIComponent(m[1]) };
  if ((m = h.match(/^#\/bounty\/([^/]+)\/?$/))) return { name: 'bounty', slug: decodeURIComponent(m[1]) };
  if ((m = h.match(/^#\/u\/([^/]+)\/?$/))) return { name: 'profile', handle: decodeURIComponent(m[1]) };
  return { name: 'board' };
}

function loading(text) {
  app.innerHTML = `<p class="loading" role="status">${text}</p>`;
}

function failed(err) {
  // The message comes from the network, so it is escaped like any API value.
  app.innerHTML = `<div class="error" role="alert"><p><b>Could not load this page.</b></p><p>${esc(err.message)}. The make.fun API may be unreachable — check the connection and retry.</p><p><button type="button" data-retry>Retry</button></p></div>`;
  window.__shotReady = true;
}

function title(text) {
  document.title = text + ' | make.fun bounties';
}

/** What had focus before a re-render, so it can be put back afterwards. */
function focusState() {
  const keep = document.activeElement?.id;
  return { keep, caret: keep === 'q' ? document.getElementById('q')?.selectionStart ?? null : null };
}

/** Put focus back after a re-render (a refetch must not steal the keyboard). */
function restoreFocus({ keep, caret }) {
  const el = keep ? document.getElementById(keep) : null;
  if (!el) return;
  el.focus();
  if (caret !== null && 'setSelectionRange' in el) el.setSelectionRange(caret, caret);
}

/** Re-render the board's list in place, keeping the filters focused. */
function paintBoard() {
  const list = app.querySelector('.board');
  if (!list) return;
  const focus = focusState();
  app.innerHTML = boardView(boardItems, ui);
  restoreFocus(focus);
  const note = document.getElementById('board-note');
  if (note) note.textContent = boardCursor ? 'Showing the first 50 open bounties — use search to narrow them.' : '';
}

async function renderBoard() {
  title('make.fun bounties');
  if (!boardItems.length) {
    loading('Loading the live board…');
    try {
      const data = await getBounties();
      boardItems = data.items || [];
      boardCursor = data.next_cursor || null;
      ui.cats = [...new Set(boardItems.map((b) => b.category).filter(Boolean))].sort();
    } catch (err) {
      failed(err);
      return;
    }
  }
  const focus = focusState();
  app.innerHTML = boardView(boardItems, ui);
  restoreFocus(focus);
  const note = document.getElementById('board-note');
  if (note) note.textContent = boardCursor ? 'Showing the first 50 open bounties — use search to narrow them.' : '';
  window.__shotReady = true;
}

async function renderBounty(slug) {
  loading('Loading the bounty…');
  try {
    const [b, d] = await Promise.all([getBounty(slug), loadDetail()]);
    title(b.title);
    app.innerHTML = d.bountyView(b);
  } catch (err) {
    failed(err);
    return;
  }
  window.__shotReady = true;
}

async function renderLeaderboard(slug) {
  loading('Loading the leaderboard…');
  try {
    const [lb, d] = await Promise.all([getLeaderboard(slug), loadDetail()]);
    title('Leaderboard: ' + (lb.competition?.title || slug));
    shown = 100;
    app.innerHTML = d.leaderboardView(lb, shown);
    app.querySelector('[data-show-all]')?.addEventListener('click', () => {
      shown = (lb.entries || []).length;
      app.innerHTML = d.leaderboardView(lb, shown);
    });
  } catch (err) {
    failed(err);
    return;
  }
  window.__shotReady = true;
}

async function renderProfile(handle) {
  loading('Loading the profile…');
  try {
    const [p, d] = await Promise.all([getProfile(handle), loadDetail()]);
    title((p.display_name || p.handle) + ' on make.fun');
    app.innerHTML = d.profileView(p);
  } catch (err) {
    failed(err);
    return;
  }
  window.__shotReady = true;
}

/** Render the current route. scroll: only a navigation scrolls to the top —
 * the minute's background refetch must leave the reader where they are. */
async function render({ scroll = true } = {}) {
  window.__shotReady = false;
  const r = route();
  if (r.name === 'bounty') await renderBounty(r.slug);
  else if (r.name === 'leaderboard') await renderLeaderboard(r.slug);
  else if (r.name === 'profile') await renderProfile(r.handle);
  else await renderBoard();
  if (scroll) window.scrollTo(0, 0);
}

// Board controls: re-filter without losing focus or refetching.
app.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'q') {
    ui.q = t.value;
    paintBoard();
  } else if (t.id === 'openOnly') {
    ui.openOnly = t.checked;
    paintBoard();
  }
});
app.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'cat') {
    ui.cat = t.value;
    paintBoard();
  } else if (t.id === 'sort') {
    ui.sort = t.value;
    paintBoard();
  }
});
app.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-retry]')) render();
});

// Header profile lookup: go to #/u/<handle>.
lookup.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const handle = lookup.handle.value.trim();
  if (handle) location.hash = '#/u/' + encodeURIComponent(handle);
});

// Countdowns tick every 30 seconds; the board refetches (ETag 304) each minute.
setInterval(() => {
  for (const el of document.querySelectorAll('[data-deadline]')) el.textContent = timeLeft(el.dataset.deadline);
}, 30000);
setInterval(() => {
  if (route().name === 'board' && boardItems.length) render({ scroll: false });
}, 60000);

window.addEventListener('hashchange', () => render());
render();
