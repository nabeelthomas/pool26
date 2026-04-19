# Pool '26

A tiny private NHL playoff pool leaderboard for six friends. Static site,
procedural textures (no image assets), pulls live skater stats from the
public NHL API on a cron.

> **Scoring.** `G = 1`, `A = 1`. No bonuses, no goalies. 15 skaters per
> manager. Totals carry across all rounds.

## Stack

- Vite + React 18 + TypeScript (strict)
- Static JSON data files in `public/data/`
- Public NHL stats endpoint (`api.nhle.com/stats/rest/en/skater/summary`)
- GitHub Actions cron → commits updated `stats.json`
- Cloudflare Pages hosting (build: `npm run build`, output: `dist`)

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # strict tsc
npm run build      # produces dist/
npm run preview    # serve the built site
```

## Data files

All three files live in `public/data/`:

| File          | Edited by   | When                                  |
|---------------|-------------|---------------------------------------|
| `rosters.json`| me, by hand | once at draft time                    |
| `stats.json`  | cron job    | 5×/day during playoffs                |
| `events.json` | n/a yet     | placeholder for a future play-by-play |
| `jokes.json`  | me, by hand | anytime — ticker interleaves them     |

### Editing rosters

`rosters.json` defines every manager and their 15 skaters. For players
whose names involve non-ASCII characters, add an `aliases` array so the
NHL API lookup can still match:

```json
{ "name": "Tim Stutzle", "team": "OTT", "pos": "F", "aliases": ["Tim Stützle"] }
```

Run `npm run update-stats` locally after editing to see which players
matched, and add aliases for any misses.

### Editing jokes

`jokes.json` is just `{ "jokes": ["…", "…"] }`. The ticker interleaves a
joke after every two scoring events.

## Stats updater

`scripts/update-stats.mjs` hits the NHL API, joins its response against
our roster, and rewrites `public/data/stats.json`. It is safe to re-run:

- If the API returns 0 rows (pre-playoffs / outage), the existing
  `stats.json` is left alone.
- If the results are byte-identical to what's on disk, no write happens
  and the Actions job skips the commit step.
- Every roster miss is logged at warn level with the manager + player
  name so we can add aliases.

### Cron schedule

GitHub Actions runs the updater at 09:00, 19:00, 21:00, 22:00, and 23:59
Eastern (EDT; the playoffs are all daylight time). See
`.github/workflows/update-stats.yml`. Manual runs are available from the
Actions tab via `workflow_dispatch`.

## Deploying

Cloudflare Pages project connected to the GitHub repo:

- **Build command:** `npm run build`
- **Build output:** `dist`
- **Root directory:** (repo root)
- **Node version:** 20

No environment variables needed.

## Project layout

```
public/
  data/                # rosters / stats / events / jokes
  favicon.svg
scripts/
  update-stats.mjs     # NHL API fetcher
src/
  components/          # all React components
  lib/                 # dataFetch, standings, format, textures
  styles/globals.css
  types.ts
.github/workflows/
  update-stats.yml     # cron schedule
```

## License

Private. For six friends and one dog.
