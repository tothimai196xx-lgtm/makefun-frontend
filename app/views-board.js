// The bounty board: every listed bounty with its live pot, entry fee, time
// left and entry count. One API call, cached and ETag-revalidated, then the
// filters (search, category, sort, open-only) re-render only the list, so
// typing never steals focus or rebuilds the page.

import { getJson } from './api.js';
import { esc, num, stillOpen, timeLeft, usd0 } from './format.js';
import { errorView, loadingView } from './main.js';

function bountyOpen(c, now) {
  return c.status === 'open' && stillOpen(c.deadline, now);
}

function sortKey(sort) {
  if (sort === 'pot') return (a, b) => Number(b.potUsd || 0) - Number(a.potUsd || 0);
  if (sort === 'entries') return (a, b) => Number(b.submissionCount || 0) - Number(a.submissionCount || 0);
  if (sort === 'newest') return (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt);
  return (a, b) => new Date(a.deadline) - new Date(b.deadline); // ending soon
}

function rowHtml(c, now) {
  const open = bountyOpen(c, now);
  const endsSoon = open && new Date(c.deadline).getTime() - now < 24 * 3600 * 1000;
  const pill = open
    ? (endsSoon ? '<span class="pill soon">Closing soon</span>' : '<span class="pill open">Open</span>')
    : '<span class="pill closed">Closed</span>';
  const fee = c.entryFeeUsd ? `$${Number(c.entryFeeUsd).toFixed(2)} entry fee` : 'Free to enter';
  const skills = (c.skills || []).slice(0, 4)
    .map((s) => `<span class="tag">${esc(s)}</span>`).join('');
  const summary = (c.summary || c.description || '').split('\n')[0].trim();
  const short = summary.length > 180 ? summary.slice(0, 177) + '…' : summary;

  return `<li class="row">
    <div class="row-head">
      <a class="row-title" href="#/bounty/${esc(c.slug)}">${esc(c.title)}</a>
      <div class="row-pot"><b>${usd0(c.potUsd ?? c.rewardAmount)}</b><span>live pot</span></div>
    </div>
    <div class="row-meta">${pill}<span>${esc(c.category || '')}</span><span>${esc(fee)}</span><span>${esc(timeLeft(c.deadline, now))}</span><span>${num(c.submissionCount)} entries</span></div>
    ${short ? `<p class="row-desc">${esc(short)}</p>` : ''}
    ${skills ? `<div class="tags">${skills}</div>` : ''}
  </li>`;
}

export async function renderBoard(container) {
  container.innerHTML = loadingView();
  let items;
  try {
    const data = await getJson('/competitions?status=open');
    items = data.items || data.competitions || data || [];
  } catch (err) {
    container.innerHTML = errorView(err?.message || 'Could not load the bounty board.');
    return;
  }

  const now = Date.now();
  const openCount = items.filter((c) => bountyOpen(c, now)).length;
  const totalPot = items.reduce((sum, c) => sum + (Number(c.potUsd) || 0), 0);
  const categories = [...new Set(items.map((c) => c.category).filter(Boolean))].sort();

  container.innerHTML = `
    <h1>Open bounties</h1>
    <div class="stats" role="status">
      <div><b>${num(openCount)}</b> <span>taking entries</span></div>
      <div><b>${usd0(totalPot)}</b> <span>in live pots</span></div>
      <div><b>${num(items.length)}</b> <span>listed</span></div>
    </div>
    <div class="filters">
      <input type="search" id="board-q" placeholder="Search title or slug…" aria-label="Search bounties">
      <label>Category
        <select id="board-cat" aria-label="Category">
          <option value="">All categories</option>
          ${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
        </select>
      </label>
      <label>Sort
        <select id="board-sort" aria-label="Sort">
          <option value="ending">Ending soon</option>
          <option value="pot">Biggest pot</option>
          <option value="entries">Most entries</option>
          <option value="newest">Newest</option>
        </select>
      </label>
      <label><input type="checkbox" id="board-open" checked> Open only</label>
    </div>
    <p class="countline" id="board-count"></p>
    <ul class="rows" id="board-rows"></ul>`;

  const qEl = container.querySelector('#board-q');
  const catEl = container.querySelector('#board-cat');
  const sortEl = container.querySelector('#board-sort');
  const openEl = container.querySelector('#board-open');
  const rowsEl = container.querySelector('#board-rows');
  const countEl = container.querySelector('#board-count');

  function renderList() {
    const q = qEl.value.trim().toLowerCase();
    const cat = catEl.value;
    const filtered = items.filter((c) => {
      if (openEl.checked && !bountyOpen(c, Date.now())) return false;
      if (cat && c.category !== cat) return false;
      if (q && !(String(c.title).toLowerCase().includes(q) || String(c.slug).toLowerCase().includes(q))) return false;
      return true;
    });
    filtered.sort(sortKey(sortEl.value));
    const t = Date.now();
    rowsEl.innerHTML = filtered.length
      ? filtered.map((c) => rowHtml(c, t)).join('')
      : '<li class="empty">No bounties match those filters.</li>';
    countEl.textContent = filtered.length === items.length
      ? `${num(filtered.length)} bounties`
      : `${num(filtered.length)} of ${num(items.length)} bounties`;
  }

  qEl.addEventListener('input', renderList);
  catEl.addEventListener('change', renderList);
  sortEl.addEventListener('change', renderList);
  openEl.addEventListener('change', renderList);
  renderList();
}
