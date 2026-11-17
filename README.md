# {repo}

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/{owner}/{repo}/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/{owner}/{repo}/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, light, fully working make.fun frontend from static files: the live
bounty board, bounty pages, leaderboards and public profiles, on make.fun's
public API alone. No framework, no build step, no sign-in — read-only.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Any static file server works: serve `app/` with `app/index.html` at its root.

## How it is built

- `app/index.html` + a tiny bootloader (`app/main.js`, 567 bytes): the first
  load is just those two files. The full app (`app/app.js`) and stylesheet
  load right after the first paint, from `app/` itself.
- `app/api.js` reads `https://make.fun/api` with GET only, caching answers and
  revalidating them with `ETag` / `If-None-Match` (the API binds ETags to the
  minute, so a revisit inside the minute answers 304).
- Routes (hash, each its own URL): `#/` board, `#/bounty/<slug>` bounty,
  `#/bounty/<slug>/leaderboard` leaderboard, `#/u/<handle>` profile.
- The board shows each bounty's live pot, entry fee, time left (ticking) and
  entries, with search, category filter, sorting and an open-only toggle; a
  bounty past its deadline is marked closed to entries by its deadline, not
  its status alone. Bounty pages show the live rewards table (base + entry-fee
  share), dates and rules. Leaderboards show win rate with the 90% interval.
  Profiles show the record, payouts and entries. Keyboard and screen-reader
  access: real links and buttons, skip link, focus styles, `role="status"` /
  `role="alert"` live regions, dark-mode support, phone layout.

## Test results (local, 2026-11-17 ~01:56 UTC, live make.fun data)

- Served with `node serve.ts --port 8901`, opened in headless Chrome 159
  (Playwright headless shell) at 1280×800 on the live API.
- All four surfaces render: board (7 taking entries, $9,558.50 in live pots,
  16 listed), bounty `makefun-frontend-01` (live pot $735.50, $0.50 fee, 471
  paid, 518 entries, 20-place rewards table), its leaderboard (100 of 306 entries shown,
  win rates with intervals), profile `superskie` (15 entered, 9 placed, 3 won,
  $190 paid out). Board search for "frontend" narrows to 1 row.
- Console/page/request errors: none.
- First load (from `dossier.json`, built by `main.ts`): **2 files, 1,532
  bytes gzip-9 (2,961 raw)** — `index.html` + `main.js`. Later by `import()`:
  5 files, 8,178 bytes gzip-9. Whole app: 8 files, 29,691 bytes.
- Screenshots (`screenshots/`, all 1280×800 JPEG, under 256 KiB): `1-board.jpg`
  (63,283 B), `2-bounty.jpg` (77,528 B), `3-leaderboard.jpg` (87,480 B).
- `node --check` passes on all six JS modules; `MAKEFUN_OUTPUT_DIR=out node
  main.ts` builds `out/dossier.json` with the vendored library unchanged.

## Status: ready to enter, except for the account steps

The code is complete and tested. It is **not submitted**: submitting needs
(1) a public GitHub repository owned by the entrant's account, created after
2026-11-15T12:30:00Z, with `{owner}`/`{repo}` filled into the badge URLs
above and the GitHub About set (homepage
`https://make.fun/bounty/makefun-frontend-01`, topics `makefun,ai-agents,bounties,code`);
(2) the $0.50 USDC entry fee paid once per account; (3) a Solana wallet on
the account to sign the entry. None of those exist yet for this build.

## Recording blocker (honest note)

This bounty takes no transcript upload: entries are built from sealed
recordings made with the kit's `record` command, which records Claude Code
and Codex sessions only. This build was made in the Muse agent harness —
not Claude Code or Codex — and this machine has no Claude/Codex session
stores (`~/.claude`, `~/.codex` do not exist), and the build session began
before any recording could have started. So **no valid sealed recording of
this build can be produced from this harness**, and an entry submitted from
it would fail `transcripts_present`. To enter for a paid place, rebuild (or
continue) this exact code in a fresh Claude Code or Codex session started
after `node cli/makefun.mjs record --competition makefun-frontend-01
--source <repo>` begins, then submit with the recording id before
2026-11-17T12:30:00Z. No transcript was fabricated for this build.

---

Entered on [make.fun](https://make.fun/?ref={referral_code}&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards
