// The bounty, leaderboard and profile pages: functions from API data to HTML.
// Loaded on demand by main.js, after the first load, with a literal import().

import { bytes, date, esc, money, num, pct, takesEntries, timeLeft, yesno } from './format.js';
import { pot } from './views-board.js';

const SITE = 'https://make.fun';

/** An <img> for an API image. make.fun's images send Cross-Origin-Resource-Policy:
 * same-origin, so crossorigin="anonymous" goes on before src. */
function img(src, alt, cls) {
  if (!src) return '';
  const url = src.startsWith('/') ? SITE + src : src;
  return `<img class="${cls}" crossorigin="anonymous" src="${esc(url)}" alt="${esc(alt)}" loading="lazy">`;
}

/** Inline markdown: **bold**, `code`, and links [text](https://…). Links open
 * in a new tab with rel="noopener" — the API text is not ours to trust. */
function inline(text) {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

/** A bounty description: #, ## and ### headings, > quotes, - lists, paragraphs. */
export function md(text) {
  const lines = String(text ?? '').split('\n');
  let html = '';
  let list = false;
  const closeList = () => {
    if (list) {
      html += '</ul>';
      list = false;
    }
  };
  for (const line of lines) {
    if (line.startsWith('### ')) {
      closeList();
      html += `<h3>${inline(line.slice(4))}</h3>`;
    } else if (line.startsWith('## ')) {
      closeList();
      html += `<h2>${inline(line.slice(3))}</h2>`;
    } else if (line.startsWith('# ')) {
      closeList();
      html += `<h2>${inline(line.slice(2))}</h2>`;
    } else if (line.startsWith('> ')) {
      closeList();
      html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    } else if (line.startsWith('- ')) {
      if (!list) {
        html += '<ul>';
        list = true;
      }
      html += `<li>${inline(line.slice(2))}</li>`;
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

/** A bounty's page: summary, rules, rewards with the live pot, dates, status. */
export function bountyView(b) {
  const open = takesEntries(b);
  const live = Array.isArray(b.rewardsNow) && b.rewardsNow.length ? b.rewardsNow : null;
  const rewardRows = live
    ? live
        .map(
          (r) => `<tr><td>${num(r.place)}</td><td class="num">${money(r.baseUsd)}</td><td class="num">${money(r.feeShareUsd)}</td><td class="num"><b>${money(r.amountUsd)}</b></td></tr>`,
        )
        .join('')
    : Object.entries(b.rewards || {})
        .map(([place, amount]) => `<tr><td>${num(place)}</td><td class="num">${money(amount)}</td><td class="num">—</td><td class="num"><b>${money(amount)}</b></td></tr>`)
        .join('');
  return `
    <p><a href="#/">← All bounties</a></p>
    <h1>${esc(b.title)}</h1>
    <p><span class="chip ${open ? 'open' : 'shut'}">${open ? 'Open for entries' : 'Closed to entries'}</span>
    <span class="chip">${esc(b.category || '')}</span>
    <span class="chip">${num(b.submissionCount)} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span></p>
    <p>${esc(b.summary || '')}</p>
    <dl class="facts">
      <dt>Live pot</dt><dd><b>${pot(b)}</b> (base reward ${money(b.rewardAmount)})</dd>
      <dt>Entry fee</dt><dd>${b.entryFeeUsd ? money(b.entryFeeUsd) + ' once per account' : 'None'}${b.entryFeePayers ? ` · ${num(b.entryFeePayers)} paid` : ''}</dd>
      <dt>Deadline</dt><dd><span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span> · ${date(b.deadline)}</dd>
      <dt>Published</dt><dd>${date(b.publishedAt)}</dd>
      <dt>Sponsor</dt><dd>${esc(b.sponsor?.name || '—')}${b.sponsor?.isVerified ? ' ✓' : ''}</dd>
    </dl>
    <p><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard →</a> ·
    <a href="${SITE}/bounty/${encodeURIComponent(b.slug)}" rel="noopener">View on make.fun ↗</a></p>
    <h2>Rewards</h2>
    <table>
      <thead><tr><th>Place</th><th class="num">Base</th><th class="num">From entry fees</th><th class="num">Now</th></tr></thead>
      <tbody>${rewardRows}</tbody>
    </table>
    <h2>Rules</h2>
    <div class="desc">${md(b.description || '')}</div>`;
}

/** A bounty's leaderboard: rank, entrant, win rate with its 90% interval, size. */
export function leaderboardView(lb, shown) {
  const c = lb.competition || {};
  const entries = lb.entries || [];
  const rows = entries
    .slice(0, shown)
    .map((e) => {
      const v = e.values || {};
      const d = e.display || {};
      return `<tr>
        <td class="num">${num(e.rank)}</td>
        <td><span class="who">${img(e.image, e.handle + ' avatar', 'avatar sm')}<a href="#/u/${encodeURIComponent(e.handle)}">${esc(e.handle)}</a></span><br><span class="mut">${esc(e.title || '')}</span></td>
        <td class="num"><b>${pct(v.judge ?? d.judge)}</b></td>
        <td class="num">${pct(v.judge_low ?? d.judge_low)} – ${pct(v.judge_high ?? d.judge_high)}</td>
        <td class="num">${yesno(v.valid ?? d.valid)}</td>
        <td class="num">${bytes(v.bytes ?? d.bytes)}</td>
      </tr>`;
    })
    .join('');
  return `
    <p><a href="#/bounty/${encodeURIComponent(c.slug || '')}">← ${esc(c.title || 'Bounty')}</a></p>
    <h1>Leaderboard: ${esc(c.title || '')}</h1>
    <p class="mut">${esc(lb.phase?.title || '')}${lb.phase?.ends_at ? ` · ends ${date(lb.phase.ends_at)}` : ''} · ranked by ${esc(lb.rank_key || 'judge')} win rate · tie-break: smaller dossier</p>
    ${entries.length ? `
    <table>
      <thead><tr><th class="num">#</th><th>Entrant</th><th class="num">Win rate</th><th class="num">90% interval</th><th class="num">Valid</th><th class="num">Size</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="mut">Showing ${num(Math.min(shown, entries.length))} of ${num(entries.length)} entries.</p>
    ${entries.length > shown ? '<p class="more"><button type="button" class="ghost" data-show-all>Show all</button></p>' : ''}`
    : '<p>No scored entries yet — results appear as the judge heat runs.</p>'}`;
}

/** An account's public profile: record, payouts, entries. */
export function profileView(p) {
  const r = p.record || {};
  const payouts = Array.isArray(p.payouts) ? p.payouts : [];
  const paid = payouts.reduce((s, x) => s + Number(x.amount_usd || 0), 0);
  const solutions = (p.solutions || [])
    .map(
      (s) => {
        const comp = s.competition || {};
        return `<tr>
          <td><a href="#/bounty/${encodeURIComponent(comp.slug || '')}">${esc(s.title || comp.title || '')}</a><br><span class="mut">${esc(comp.title || '')}</span></td>
          <td class="num">${s.placement ? '#' + num(s.placement) : '—'}</td>
          <td class="num">${s.prize_usd ? money(s.prize_usd) : '—'}</td>
          <td class="num">${s.score ? pct(s.score.value) : '—'}</td>
          <td class="num">${date(s.entered_at)}</td>
        </tr>`;
      },
    )
    .join('');
  return `
    <p><a href="#/">← All bounties</a></p>
    <div class="profile-head">
      ${img(p.avatar?.url || p.image, (p.display_name || p.handle) + ' avatar', 'avatar')}
      <div>
        <h1>${esc(p.display_name || p.handle)}</h1>
        <p class="mut">@${esc(p.handle)} · joined ${date(p.joined_at)}</p>
        ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
        <p>${p.github_login ? `<a href="https://github.com/${encodeURIComponent(p.github_login)}" rel="noopener">GitHub: ${esc(p.github_login)}</a> · ` : ''}${p.x ? `<a href="https://x.com/${encodeURIComponent(p.x)}" rel="noopener">X: ${esc(p.x)}</a> · ` : ''}${p.discord ? `<span>Discord: ${esc(p.discord)}</span>` : ''}</p>
      </div>
    </div>
    <div class="statgrid">
      <div><b>${num(r.competitions_entered)}</b><span>entered</span></div>
      <div><b>${num(r.competitions_placed)}</b><span>placed</span></div>
      <div><b>${num(r.competitions_won)}</b><span>won</span></div>
      <div><b>${num(r.podium_finishes)}</b><span>podiums</span></div>
      <div><b>${r.best_placement ? '#' + num(r.best_placement) : '—'}</b><span>best place</span></div>
      <div><b>${money(r.prize_usd)}</b><span>prize money</span></div>
      <div><b>${money(paid)}</b><span>paid out (${num(payouts.length)})</span></div>
    </div>
    <h2>Entries</h2>
    ${solutions ? `
    <table>
      <thead><tr><th>Entry</th><th class="num">Place</th><th class="num">Prize</th><th class="num">Score</th><th class="num">Entered</th></tr></thead>
      <tbody>${solutions}</tbody>
    </table>` : '<p>No entries yet.</p>'}`;
}
