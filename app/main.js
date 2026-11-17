// Shell and router. Every surface has its own hash URL, so each is linkable
// and bookmarkable: #/ (board), #/bounty/<slug>, #/bounty/<slug>/leaderboard
// and #/u/<handle>. View modules load lazily, so the first load is only the
// shell, the stylesheet and this file; the board, detail and profile code
// arrives when its route is first opened.

import { esc } from './format.js';

const viewEl = document.getElementById('view');
const profileForm = document.getElementById('profile-form');
const profileInput = document.getElementById('profile-handle');

let routeToken = 0;

/** Parse location.hash into { name, slug, handle }. */
export function parseRoute(hash) {
  const path = (hash || '#/').replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'board' };
  if (parts[0] === 'bounty' && parts[1]) {
    if (parts[2] === 'leaderboard') return { name: 'leaderboard', slug: parts[1] };
    return { name: 'bounty', slug: parts[1] };
  }
  if (parts[0] === 'u' && parts[1]) return { name: 'profile', handle: parts[1] };
  return { name: 'board' };
}

function setShotReady(ready) {
  window.__shotReady = ready;
}

/** Shared error box with a retry button that re-runs the current route. */
export function errorView(message, retryLabel = 'Try again') {
  return `<div class="error" role="alert"><p>${esc(message)}</p>` +
    `<button class="btn" type="button" data-retry>${esc(retryLabel)}</button></div>`;
}

export function loadingView(text = 'Loading live data from make.fun…') {
  return `<p class="loading">${esc(text)}</p>`;
}

async function render() {
  const token = ++routeToken;
  const route = parseRoute(location.hash);
  setShotReady(false);
  document.title = 'make.fun bounties';
  document.querySelectorAll('[data-nav]').forEach((a) => a.removeAttribute('aria-current'));
  const boardLink = document.querySelector('[data-nav="board"]');
  if (route.name === 'board' && boardLink) boardLink.setAttribute('aria-current', 'page');

  try {
    if (route.name === 'board') {
      const { renderBoard } = await import('./views-board.js');
      if (token !== routeToken) return;
      await renderBoard(viewEl);
      document.title = 'Open bounties · make.fun';
    } else if (route.name === 'bounty') {
      const { renderBounty } = await import('./views-detail.js');
      if (token !== routeToken) return;
      await renderBounty(viewEl, route.slug);
    } else if (route.name === 'leaderboard') {
      const { renderLeaderboard } = await import('./views-detail.js');
      if (token !== routeToken) return;
      await renderLeaderboard(viewEl, route.slug);
    } else {
      const { renderProfile } = await import('./views-profile.js');
      if (token !== routeToken) return;
      await renderProfile(viewEl, route.handle);
    }
  } catch (err) {
    if (token !== routeToken) return;
    const message = err?.status === 404
      ? 'That page does not exist on make.fun (404).'
      : (err?.message || 'Something went wrong while loading make.fun.');
    viewEl.innerHTML = errorView(message);
  } finally {
    if (token === routeToken) setShotReady(true);
  }
}

viewEl.addEventListener('click', (event) => {
  const retry = event.target.closest('[data-retry]');
  if (retry) render();
});

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const handle = profileInput.value.trim().replace(/^@/, '');
  if (handle) location.hash = '#/u/' + encodeURIComponent(handle);
});

window.addEventListener('hashchange', render);
render();
