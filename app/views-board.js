// The board page: a function from API data to HTML.
// Loaded on the first load (see main.js); the other pages load on demand.

import { esc, money, num, takesEntries, timeLeft } from './format.js';

/** The reward as it stands now: the live pot, entry fees included. */
export function pot(b) {
  return money(b.potUsd ?? b.rewardAmount);
}

/** One board row: title, pot, entry fee, time left, entries. */
function boardRow(b) {
  const open = takesEntries(b);
  return `
      <li>
        <h3><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></h3>
        <p class="pot">${pot(b)}<small>live pot</small></p>
        <p class="meta">
          <span class="chip ${open ? 'open' : 'shut'}">${open ? 'Open' : 'Closed to entries'}</span>
          <span>${esc(b.category || '')}</span>
          <span>${b.entryFeeUsd ? money(b.entryFeeUsd) + ' entry fee' : 'Free to enter'}</span>
          <span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>
          <span>${num(b.submissionCount)} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>
        </p>
      </li>`;
}

/** The live bounty board. ui: { q, cat, sort, openOnly, cats }. */
export function boardView(items, ui) {
  const q = ui.q.trim().toLowerCase();
  let rows = items.filter((b) => {
    if (ui.openOnly && !takesEntries(b)) return false;
    if (ui.cat && b.category !== ui.cat) return false;
    if (q && !(b.title + ' ' + b.slug + ' ' + (b.category || '')).toLowerCase().includes(q)) return false;
    return true;
  });
  const by = {
    ending: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    pot: (a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount),
    entries: (a, b) => b.submissionCount - a.submissionCount,
    newest: (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  };
  rows = rows.slice().sort(by[ui.sort] || by.ending);
  const totalPot = items.reduce((s, b) => s + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  const openCount = items.filter(takesEntries).length;
  // The active category stays selectable even if a refetch no longer lists it,
  // so the filter and the select never disagree about what is applied.
  const cats = ui.cat && !ui.cats.includes(ui.cat) ? [ui.cat, ...ui.cats] : ui.cats;
  const options = cats
    .map((c) => `<option value="${esc(c)}"${c === ui.cat ? ' selected' : ''}>${esc(c)}</option>`)
    .join('');
  return `
    <h1>Open bounties</h1>
    <p class="stats"><span><b>${num(openCount)}</b> taking entries</span><span><b>${money(totalPot)}</b> in live pots</span><span><b>${num(items.length)}</b> listed</span></p>
    <div class="toolbar" role="search">
      <label class="vh" for="q">Search bounties</label>
      <input id="q" type="search" placeholder="Search title or slug…" value="${esc(ui.q)}" autocomplete="off">
      <label>Category
        <select id="cat"><option value="">All categories</option>${options}</select>
      </label>
      <label>Sort
        <select id="sort">
          <option value="ending"${ui.sort === 'ending' ? ' selected' : ''}>Ending soon</option>
          <option value="pot"${ui.sort === 'pot' ? ' selected' : ''}>Largest pot</option>
          <option value="entries"${ui.sort === 'entries' ? ' selected' : ''}>Most entries</option>
          <option value="newest"${ui.sort === 'newest' ? ' selected' : ''}>Newest</option>
        </select>
      </label>
      <label><input id="openOnly" type="checkbox"${ui.openOnly ? ' checked' : ''}> Open only</label>
    </div>
    <ul class="board">${rows.map(boardRow).join('') || '<li>No bounties match.</li>'}</ul>
    <p class="mut" id="board-note"></p>`;
}
