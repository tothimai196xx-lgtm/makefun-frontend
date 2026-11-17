// A bounty's page and its leaderboard. The bounty page shows the summary,
// the full rules text (rendered Markdown), the live pot and fee, the dates
// and the rewards table with the fee shares as they stand now. The
// leaderboard shows the judged entries ranked by win rate, 25 rows at a time,
// with each entrant's avatar and a link to their public profile.

import { apiImage, getJson } from './api.js';
import { bytes, dateShort, dateTime, esc, num, stillOpen, timeLeft, usd, usd0, winRate } from './format.js';
import { renderMarkdown } from './md.js';
import { errorView, loadingView } from './main.js';

const PAGE_SIZE = 25;

function statusPill(c, now) {
  if (c.status === 'open' && stillOpen(c.deadline, now)) {
    return '<span class="pill open">Open for entries</span>';
  }
  if (c.status === 'open') return '<span class="pill closed">Entries closed</span>';
  return `<span class="pill closed">${esc(c.status)}</span>`;
}

function rewardsTable(c) {
  const nowRows = (c.rewardsNow || []).slice().sort((a, b) => a.place - b.place);
  if (nowRows.length) {
    return `<table>
      <thead><tr><th>Place</th><th class="num">Base</th><th class="num">From entry fees</th><th class="num">Now</th></tr></thead>
      <tbody>${nowRows.map((r) => `<tr>
        <td>${num(r.place)}</td>
        <td class="num">${usd(r.baseUsd)}</td>
        <td class="num">${usd(r.feeShareUsd)}</td>
        <td class="num"><strong>${usd(r.amountUsd)}</strong></td>
      </tr>`).join('')}</tbody>
    </table>`;
  }
  const base = c.rewards || {};
  const places = Object.keys(base).map(Number).sort((a, b) => a - b);
  if (!places.length) return '<p class="muted">No rewards table published yet.</p>';
  return `<table>
    <thead><tr><th>Place</th><th class="num">Reward</th></tr></thead>
    <tbody>${places.map((p) => `<tr><td>${num(p)}</td><td class="num"><strong>${usd(base[p])}</strong></td></tr>`).join('')}</tbody>
  </table>`;
}

export async function renderBounty(container, slug) {
  container.innerHTML = loadingView();
  let c;
  try {
    c = await getJson('/competitions/' + encodeURIComponent(slug));
  } catch (err) {
    container.innerHTML = errorView(err?.message || 'Could not load that bounty.');
    return;
  }
  document.title = `${c.title} · make.fun`;

  const now = Date.now();
  const feeLine = c.entryFeeUsd
    ? `$${Number(c.entryFeeUsd).toFixed(2)} once per account · ${num(c.entryFeePayers)} paid`
    : 'Free to enter';
  const sponsor = c.sponsor?.name
    ? esc(c.sponsor.name) + (c.sponsor.isVerified ? ' ✓' : '')
    : '—';
  const firstPara = String(c.description || '').split('\n\n')[0].trim();

  container.innerHTML = `
    <a class="backlink" href="#/">← All bounties</a>
    <h1>${esc(c.title)}</h1>
    <div class="row-meta">${statusPill(c, now)}<span>${esc(c.category || '')}</span><span>${num(c.submissionCount)} entries</span></div>
    ${firstPara ? `<p class="sub">${esc(firstPara)}</p>` : ''}
    <div class="facts"><dl>
      <dt>Live pot</dt><dd><strong>${usd0(c.potUsd ?? c.rewardAmount)}</strong> <span class="muted">(base reward ${usd0(c.rewardAmount)})</span></dd>
      <dt>Entry fee</dt><dd>${esc(feeLine)}</dd>
      <dt>Deadline</dt><dd>${esc(timeLeft(c.deadline, now))} · ${esc(dateTime(c.deadline))}</dd>
      <dt>Published</dt><dd>${esc(dateTime(c.publishedAt))}</dd>
      <dt>Sponsor</dt><dd>${sponsor}</dd>
    </dl></div>
    <p><a href="#/bounty/${esc(c.slug)}/leaderboard">Leaderboard →</a> · <a href="https://make.fun/bounty/${esc(c.slug)}" target="_blank" rel="noopener">View on make.fun ↗</a></p>
    <h2>Rewards</h2>
    ${rewardsTable(c)}
    <h2>Rules &amp; description</h2>
    <div class="md">${renderMarkdown(c.description || '')}</div>`;

  // Hide avatar images that fail to load (capture phase: error does not bubble).
  container.addEventListener('error', (e) => {
    if (e.target instanceof HTMLImageElement) e.target.style.display = 'none';
  }, true);
}

function entryRow(e, rankKey) {
  const v = e.values || {};
  const rate = winRate(v[rankKey] ?? v.judge);
  const low = winRate(v.judge_low);
  const high = winRate(v.judge_high);
  const img = apiImage(e.image);
  const avatar = img
    ? `<img class="lb-avatar" src="${esc(img)}" alt="" crossorigin="anonymous" loading="lazy">`
    : '';
  const handle = e.handle
    ? `<a href="#/u/${encodeURIComponent(e.handle)}">${esc(e.handle)}</a>`
    : esc(e.title || '—');
  const medal = e.rank === 1 ? 'medal-1' : e.rank === 2 ? 'medal-2' : e.rank === 3 ? 'medal-3' : '';
  return `<tr>
    <td class="${medal}">${num(e.rank)}</td>
    <td>${avatar}${handle}<div class="lb-title">${esc(e.title || '')}</div></td>
    <td class="num winrate">${rate}</td>
    <td class="num hide-narrow">${low} – ${high}</td>
    <td class="num hide-narrow">${v.valid ?? '—'}</td>
    <td class="num hide-narrow">${bytes(v.bytes)}</td>
  </tr>`;
}

export async function renderLeaderboard(container, slug) {
  container.innerHTML = loadingView();
  let data;
  try {
    data = await getJson('/competitions/' + encodeURIComponent(slug) + '/leaderboard');
  } catch (err) {
    container.innerHTML = errorView(err?.message || 'Could not load that leaderboard.');
    return;
  }
  const comp = data.competition || {};
  const phase = data.phase || {};
  document.title = `Leaderboard: ${comp.title || slug} · make.fun`;

  const entries = (data.entries || []).filter((e) => e.ranked !== false);
  const rankKey = data.rank_key || 'judge';
  const tie = data.tie_break?.title ? ` · tie-break: ${data.tie_break.title}` : '';

  container.innerHTML = `
    <a class="backlink" href="#/bounty/${esc(slug)}">← ${esc(comp.title || slug)}</a>
    <h1>Leaderboard: ${esc(comp.title || slug)}</h1>
    <p class="sub">${esc(phase.title || '')}${phase.ends_at ? ` · ends ${esc(dateShort(phase.ends_at))}` : ''} · ranked by judge win rate${esc(tie)}</p>
    <p class="countline" id="lb-count"></p>
    <table>
      <thead><tr><th>#</th><th>Entrant</th><th class="num">Win rate</th><th class="num hide-narrow">90% interval</th><th class="num hide-narrow">Valid</th><th class="num hide-narrow">Size</th></tr></thead>
      <tbody id="lb-body"></tbody>
    </table>
    <p class="lb-more"><button class="btn" type="button" id="lb-more">Show more</button></p>`;

  const body = container.querySelector('#lb-body');
  const countEl = container.querySelector('#lb-count');
  const moreBtn = container.querySelector('#lb-more');
  let shown = 0;

  function renderMore() {
    const next = entries.slice(shown, shown + PAGE_SIZE);
    body.insertAdjacentHTML('beforeend', next.map((e) => entryRow(e, rankKey)).join(''));
    shown += next.length;
    countEl.textContent = entries.length
      ? `Showing ${num(shown)} of ${num(entries.length)} ranked entries`
      : 'No ranked entries yet.';
    moreBtn.style.display = shown >= entries.length ? 'none' : '';
  }

  moreBtn.addEventListener('click', renderMore);
  container.addEventListener('error', (e) => {
    if (e.target instanceof HTMLImageElement) e.target.style.display = 'none';
  }, true);
  renderMore();
}
