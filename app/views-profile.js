// An account's public profile: who they are, their record on make.fun and
// every solution they have entered, each linking back to its bounty.

import { apiImage, getJson } from './api.js';
import { dateShort, esc, num, usd, winRate } from './format.js';
import { errorView, loadingView } from './main.js';

function statCell(value, label) {
  return `<div class="cell"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
}

function solutionRow(s) {
  const comp = s.competition || {};
  const place = s.placement ? `Placed #${num(s.placement)}` : 'Not placed yet';
  const prize = s.prize_usd ? ` · won ${usd(s.prize_usd)}` : '';
  // score is an object: { column: { title }, value (micro units), display }.
  const score = s.score && typeof s.score === 'object'
    ? ` · ${esc(s.score.column?.title || 'Score')} ${winRate(s.score.value)}`
    : (s.score != null ? ` · score ${esc(s.score)}` : '');
  return `<li class="row">
    <div class="row-head">
      <a class="row-title" href="#/bounty/${esc(comp.slug)}">${esc(comp.title || s.title || '')}</a>
      <div class="row-pot"><b>${usd(comp.reward_usd)}</b><span>reward</span></div>
    </div>
    <div class="row-meta"><span>${esc(comp.category || '')}</span><span>${esc(place)}${esc(prize)}${esc(score)}</span><span>entered ${esc(dateShort(s.entered_at))}</span></div>
  </li>`;
}

export async function renderProfile(container, handle) {
  container.innerHTML = loadingView();
  let p;
  try {
    p = await getJson('/profiles/' + encodeURIComponent(handle));
  } catch (err) {
    const message = err?.status === 404
      ? `No public profile for “${handle}” on make.fun. Check the spelling and try again.`
      : (err?.message || 'Could not load that profile.');
    container.innerHTML = errorView(message);
    return;
  }
  document.title = `${p.display_name || p.handle} · make.fun`;

  const avatarSrc = apiImage(p.image || p.avatar);
  const avatar = avatarSrc
    ? `<img src="${esc(avatarSrc)}" alt="Avatar of ${esc(p.handle)}" crossorigin="anonymous">`
    : '';
  const name = p.display_name || p.handle;
  const links = [];
  if (p.github_login) links.push(`<a href="https://github.com/${encodeURIComponent(p.github_login)}" target="_blank" rel="noopener">GitHub ↗</a>`);
  if (p.x) links.push(`<a href="https://x.com/${encodeURIComponent(p.x)}" target="_blank" rel="noopener">X ↗</a>`);
  if (p.discord) links.push(`<span>Discord: ${esc(p.discord)}</span>`);
  if (p.wallet?.address) links.push(`<a href="${esc(p.wallet.explorer_url || ('https://solscan.io/account/' + p.wallet.address))}" target="_blank" rel="noopener">Wallet ↗</a>`);
  const rec = p.record || {};
  const solutions = p.solutions || [];

  container.innerHTML = `
    <a class="backlink" href="#/">← All bounties</a>
    <div class="profile-head">${avatar}<div>
      <h1>${esc(name)}</h1>
      <p class="handle-line">@${esc(p.handle)} · joined ${esc(dateShort(p.joined_at))}${p.house ? ' · house account' : ''}</p>
    </div></div>
    ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
    ${links.length ? `<p class="row-meta">${links.join('')}</p>` : ''}
    <div class="statgrid">
      ${statCell(num(rec.competitions_entered), 'bounties entered')}
      ${statCell(num(rec.competitions_placed), 'placements')}
      ${statCell(num(rec.competitions_won), 'wins')}
      ${statCell(num(rec.podium_finishes), 'podium finishes')}
      ${statCell(rec.best_placement ? '#' + num(rec.best_placement) : '—', 'best placement')}
      ${statCell(usd(rec.prize_usd), 'prize money won')}
    </div>
    <h2>Entries (${num(solutions.length)})</h2>
    ${solutions.length
      ? `<ul class="rows">${solutions.map(solutionRow).join('')}</ul>`
      : '<p class="empty">No entries yet.</p>'}`;

  container.addEventListener('error', (e) => {
    if (e.target instanceof HTMLImageElement) e.target.style.display = 'none';
  }, true);
}
