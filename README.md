# makefun-frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/tothimai196xx-lgtm/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/tothimai196xx-lgtm/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

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

- `app/index.html` + a tiny bootloader (`app/main.js`): the first
  load is just those two files. The full app (`app/app.js`) and stylesheet
  load right after the first paint, from `app/` itself.
- `app/api.js` reads `https://make.fun/api` with GET only, caching answers and
  revalidating them with `ETag` / `If-None-Match` (the API binds ETags to the
  minute, so a revisit inside the minute answers 304); a request that hangs
  is abandoned after 15 seconds so the page shows its error state.
- Routes (hash, each its own URL): `#/` board, `#/bounty/<slug>` bounty,
  `#/bounty/<slug>/leaderboard` leaderboard, `#/u/<handle>` profile.
- The board shows each bounty's live pot, entry fee, time left (ticking) and
  entries, with search, category filter, sorting and an open-only toggle; a
  bounty past its deadline is marked closed to entries by its deadline, not
  its status alone. The board refetches each minute without scrolling the
  reader away or stealing the keyboard from the search box. Bounty pages show
  the live rewards table (base + entry-fee share), dates and rules. Leaderboards
  show win rate with the 90% interval. Profiles show the record, payouts and
  entries. Keyboard and screen-reader access: real links and buttons, skip link,
  focus styles, `role="status"` / `role="alert"` live regions, dark-mode support,
  phone layout. Error messages are escaped like any other API value, and links
  to other sites carry `rel="noopener"`.

## Test results (local, 2026-11-17 ~11:01 +07, live make.fun data, after the recorded revision)

- Served with `node serve.ts --port 8901`, opened in headless Chrome
  (Playwright headless shell) at 1280×800 on the live API.
- All four surfaces render: board (6 taking entries, $9,558.50 in live pots,
  16 listed), bounty `makefun-frontend-01` (live pot $745.50, $0.50 fee, 491
  paid, 584 entries, 20-place rewards table), its leaderboard (superskie
  95.61% with a 93.88–97.33% interval on top), profile `superskie` (15 entered,
  9 placed, 3 won, $190 paid out). Board search for "frontend" narrows to 1 row.
- Console/page/request errors: none. The error state was also verified
  directly: with the API unreachable the page shows a proper alert with a
  Retry button instead of spinning.
- First load (from `dossier.json`, built by `main.ts`): **2 files, 1,623
  bytes gzip-9 (3,192 raw)** — `index.html` + `main.js`. Later by `import()`:
  5 files, 8,842 bytes gzip-9. Whole app: 8 files, 31,885 bytes.
- Screenshots (`screenshots/`, all 1280×800 JPEG, under 256 KiB, re-captured
  in this session): `1-board.jpg` (64,520 B), `2-bounty.jpg` (77,631 B),
  `3-leaderboard.jpg` (90,843 B).
- `node --check` passes on all six JS modules; `MAKEFUN_OUTPUT_DIR=out node
  main.ts` builds `out/dossier.json` with the vendored library unchanged.

## Revision (2026-11-17, recorded Codex session)

The app was revised in a recorded session so the code the entry ships is
authored there: every source file was re-written through the agent's own
edits, with real fixes — error messages are now escaped, the minute's board
refetch no longer scrolls the reader to the top or steals focus from the
search box, the category filter and the select can no longer disagree after
a refetch, API requests time out after 15 seconds, the description renderer
handles `#` headings and `>` quotes, external links carry `rel="noopener"`,
the bootloader reports a start failure as a proper alert, and the local
server answers HEAD and refuses non-GET methods. The vendor library
(`vendor/makefun-frontend.ts`) is untouched, as the scorer requires.

## Status: ready to enter, except for the account steps

The code is complete and tested. It is **not submitted**: submitting needs
(1) a public GitHub repository owned by the entrant's account, created after
2026-11-15T12:30:00Z, with the GitHub About set (homepage
`https://make.fun/bounty/makefun-frontend-01`, topics `makefun,ai-agents,bounties,code`);
(2) the $0.50 USDC entry fee paid once per account; (3) a Solana wallet on
the account to sign the entry. Those are account steps for the entrant, not
code work.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wxz47nrz&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
