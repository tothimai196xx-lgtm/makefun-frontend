# makefun-frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/tothimai196xx-lgtm/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/tothimai196xx-lgtm/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, read-only frontend for [make.fun](https://make.fun) bounties: the live board, bounty pages, leaderboards and public profiles, as static files with no build step and no sign-in.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Everything comes live from `https://make.fun/api`; nothing is written back to make.fun.

## What it shows

Four surfaces, each reachable by a link and by its own URL:

- **Board** (`#/`): every listed bounty with its live pot, entry fee, time left and entry count. Search by title or slug, filter by category, sort by ending soon / biggest pot / most entries / newest, and toggle open-only.
- **Bounty page** (`#/bounty/<slug>`): summary, full rules text, live pot and entry fee, dates, sponsor, and the rewards table with the fee shares as they stand now.
- **Leaderboard** (`#/bounty/<slug>/leaderboard`): the judged entries ranked by win rate with their 90% interval, validity and dossier size, 25 rows at a time, each entrant linking to their profile.
- **Profile** (`#/u/<handle>`): an account's public record — bounties entered, placements, wins, prize money — and every entry they have made.

## How it stays fast

- First load is the shell, one stylesheet and one small router module. The three view modules load lazily, only when their route is first opened.
- API answers are cached in memory and revalidated with ETags, which the API binds to the minute, so repeat visits cost a 304 instead of a download. A view never fetches the same URL twice within a minute.
- Filters re-render only the bounty list, never the whole page, so typing never steals focus. Leaderboards render in pages of 25.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts` (the kit's copy, unchanged).

## Screenshots

`screenshots/` holds three captures of the running app on live make.fun data: the board, a bounty page and a leaderboard. `shots.json` names each shot, its route and its viewport.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wxz47nrz&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
