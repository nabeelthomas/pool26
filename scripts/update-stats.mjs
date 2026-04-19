#!/usr/bin/env node
// scripts/update-stats.mjs
//
// Pulls the current playoff skater-summary table from the public NHL stats
// endpoint and writes public/data/stats.json. Run locally with:
//
//   npm run update-stats
//
// or via GitHub Actions on the schedule in .github/workflows/update-stats.yml.
//
// Design notes:
//   * Key by normalized player name (NHL's "skaterFullName") because we
//     don't carry NHL IDs in the roster. The roster supports `aliases` for
//     unicode-vs-ASCII spellings (Stützle ↔ Stutzle, etc.).
//   * We fetch until we've covered every row the endpoint says exists,
//     paging through `start` / `limit` up to a hard ceiling so we don't
//     infinite-loop on an API change.
//   * We only touch public/data/stats.json. events.json is left alone —
//     we may wire a separate per-game event fetcher later.
//   * If the API returns 0 rows (pre-playoffs, or temporary outage) we
//     keep whatever is already on disk and exit 0. That means a cron run
//     during the regular season won't wipe existing playoff data.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(__dirname);
const ROSTERS_PATH = join(REPO_ROOT, 'public', 'data', 'rosters.json');
const STATS_PATH = join(REPO_ROOT, 'public', 'data', 'stats.json');
const EVENTS_PATH = join(REPO_ROOT, 'public', 'data', 'events.json');
const SCHEDULE_PATH = join(REPO_ROOT, 'public', 'data', 'schedule.json');

// Keep at most this many ticker events on disk — the ticker recycles them
// anyway and we don't want events.json to grow unbounded across a full run.
const MAX_EVENTS = 60;

// 2025-26 season id as NHL formats it.
const SEASON_ID = '20252026';
// gameTypeId 3 = Stanley Cup playoffs.
const GAME_TYPE_ID = 3;
const PAGE_SIZE = 100;
const HARD_PAGE_LIMIT = 10; // 1000 skaters max, way more than we'd ever need.

const SUMMARY_URL = (start) =>
  `https://api.nhle.com/stats/rest/en/skater/summary?isAggregate=false` +
  `&isGame=false&sort=%5B%7B%22property%22%3A%22points%22%2C%22direction%22%3A%22DESC%22%7D%5D` +
  `&start=${start}&limit=${PAGE_SIZE}` +
  `&factCayenneExp=gamesPlayed%3E%3D1` +
  `&cayenneExp=gameTypeId%3D${GAME_TYPE_ID}%20and%20seasonId%3D${SEASON_ID}`;

/** Best-effort unicode fold → ASCII. "Stützle" → "stutzle". */
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .trim();
}

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: {
      // Polite UA so logs make sense on NHL's side.
      'User-Agent': 'pool26-leaderboard/0.1 (+github.com/thomas-nabeel/pool26)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  }
  return res.json();
}

/** Fetch every playoff skater summary row, paging until exhausted. */
async function fetchAllPlayoffSkaters() {
  const all = [];
  let total = Infinity;
  for (let page = 0; page < HARD_PAGE_LIMIT; page++) {
    const start = page * PAGE_SIZE;
    if (start >= total) break;
    const body = await fetchJSON(SUMMARY_URL(start));
    if (typeof body.total === 'number') total = body.total;
    if (!Array.isArray(body.data)) {
      throw new Error(`Unexpected payload shape at start=${start}`);
    }
    all.push(...body.data);
    if (body.data.length < PAGE_SIZE) break;
  }
  return all;
}

/**
 * Load rosters so we can warn about unmatched pool players. Any player
 * we list that the API didn't return is written in as zeros — the UI
 * renders fine either way, but warnings make it obvious when a name
 * needs an alias.
 */
function loadRosters() {
  const raw = readFileSync(ROSTERS_PATH, 'utf8');
  return JSON.parse(raw);
}

function loadPriorStats() {
  if (!existsSync(STATS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(STATS_PATH, 'utf8'));
  } catch {
    return null;
  }
}

/** Build a lookup map: normalized name → { gp, g, a }. */
function indexSkaters(rows) {
  const byNormalized = new Map();
  for (const row of rows) {
    const name = row.skaterFullName ?? '';
    if (!name) continue;
    const entry = {
      gp: row.gamesPlayed ?? 0,
      g: row.goals ?? 0,
      a: row.assists ?? 0,
    };
    byNormalized.set(normalizeName(name), { name, ...entry });
  }
  return byNormalized;
}

/**
 * Map our roster (with possible aliases) to the API data, emitting one
 * entry per roster player keyed by the roster's primary name.
 */
function buildStatsMap(rosters, byNormalized) {
  const out = {};
  const misses = [];
  for (const manager of rosters.managers) {
    for (const player of manager.roster) {
      const candidates = [player.name, ...(player.aliases ?? [])];
      let hit = null;
      for (const candidate of candidates) {
        const found = byNormalized.get(normalizeName(candidate));
        if (found) {
          hit = found;
          break;
        }
      }
      if (hit) {
        out[player.name] = { gp: hit.gp, g: hit.g, a: hit.a };
      } else {
        misses.push(`${manager.displayName}: ${player.name}`);
      }
    }
  }
  return { stats: out, misses };
}

// ─── Today's schedule + per-game scoring events ────────────────────────
//
// Two extra writes alongside stats.json:
//   1. schedule.json — list of today's NHL games with start time + status,
//      consumed by the "Tonight's slate" panel.
//   2. events.json — recent goals/assists from games involving any of our
//      pool players, fed into the ticker.
//
// Both are best-effort. If the calls fail, we log and continue — stats.json
// is still the primary product.

const SCOREBOARD_URL = 'https://api-web.nhle.com/v1/score/now';
const GAMECENTER_URL = (id) =>
  `https://api-web.nhle.com/v1/gamecenter/${id}/landing`;

/** Map team name shorthands the NHL uses to our 3-letter codes. */
function teamCode(t) {
  // The new NHL API uses tri-codes natively (EDM, MTL, etc.) but the field
  // name varies by endpoint. Just look in the most common spots.
  return (
    t?.abbrev ?? t?.triCode ?? t?.teamAbbrev?.default ?? t?.id ?? null
  );
}

function fmtClockET(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }) + ' ET';
}

async function fetchTodaySchedule() {
  try {
    const board = await fetchJSON(SCOREBOARD_URL);
    const games = (board.games ?? []).map((g) => {
      const status = g.gameState; // FUT|PRE|LIVE|FINAL|OFF
      const normalized =
        status === 'LIVE'
          ? 'live'
          : status === 'FINAL' || status === 'OFF'
            ? 'final'
            : 'scheduled';
      return {
        id: g.id,
        away: teamCode(g.awayTeam),
        home: teamCode(g.homeTeam),
        startUTC: g.startTimeUTC,
        status: normalized,
      };
    });
    return games.filter((g) => g.away && g.home && g.startUTC);
  } catch (err) {
    console.warn('[update-stats] schedule fetch failed:', err.message);
    return [];
  }
}

/**
 * Build a name → manager-display-names lookup so events know whose pool
 * a goal landed in.
 */
function buildOwnership(rosters) {
  const out = new Map();
  for (const m of rosters.managers) {
    for (const p of m.roster) {
      const key = normalizeName(p.name);
      const list = out.get(key) ?? [];
      list.push(m.displayName);
      out.set(key, list);
      if (p.aliases) {
        for (const a of p.aliases) {
          const ak = normalizeName(a);
          const al = out.get(ak) ?? [];
          al.push(m.displayName);
          out.set(ak, al);
        }
      }
    }
  }
  return out;
}

/**
 * Walk today's games, fetch each one's landing payload, and emit ticker
 * events for any goal whose scorer or primary assister is in the pool.
 */
async function fetchTodayEvents(games, ownership) {
  const events = [];
  for (const game of games) {
    if (game.status === 'scheduled') continue; // nothing to scrape yet
    let landing;
    try {
      landing = await fetchJSON(GAMECENTER_URL(game.id));
    } catch (err) {
      console.warn(`[update-stats] gamecenter ${game.id} failed:`, err.message);
      continue;
    }
    const periods = landing.summary?.scoring ?? [];
    for (const period of periods) {
      for (const goal of period.goals ?? []) {
        const scorerName =
          goal.firstName?.default && goal.lastName?.default
            ? `${goal.firstName.default} ${goal.lastName.default}`
            : goal.name?.default ?? '';
        const scorerKey = normalizeName(scorerName);
        const scorerPool = ownership.get(scorerKey);
        if (scorerPool) {
          events.push({
            type: 'GOAL',
            player: scorerName,
            team: teamCode(goal) ?? game.away,
            time: fmtClockET(goal.timeInPeriod ? game.startUTC : game.startUTC),
            pool: scorerPool.join(', '),
          });
        }
        // Primary assist (if any) is also worth a tick.
        const a1 = goal.assists?.[0];
        if (a1) {
          const aName =
            a1.firstName?.default && a1.lastName?.default
              ? `${a1.firstName.default} ${a1.lastName.default}`
              : a1.name?.default ?? '';
          const aKey = normalizeName(aName);
          const aPool = ownership.get(aKey);
          if (aPool) {
            events.push({
              type: 'ASSIST',
              player: aName,
              team: teamCode(a1) ?? game.away,
              time: fmtClockET(game.startUTC),
              pool: aPool.join(', '),
            });
          }
        }
      }
    }
  }
  // Most recent first, capped.
  return events.slice(-MAX_EVENTS).reverse();
}

function loadPriorEvents() {
  if (!existsSync(EVENTS_PATH)) return null;
  try {
    return JSON.parse(readFileSync(EVENTS_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const rosters = loadRosters();
  const prior = loadPriorStats();

  console.log('[update-stats] fetching playoff skater summary…');
  const rows = await fetchAllPlayoffSkaters();
  console.log(`[update-stats] received ${rows.length} skaters`);

  // Schedule + events run in parallel and are independent of the stats
  // diff — even if stats didn't change, the schedule status (LIVE → FINAL)
  // might have, and we want the slate to reflect that.
  const games = await fetchTodaySchedule();
  console.log(`[update-stats] schedule: ${games.length} games today`);
  writeFileSync(
    SCHEDULE_PATH,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), games },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  const ownership = buildOwnership(rosters);
  const events = await fetchTodayEvents(games, ownership);
  console.log(`[update-stats] emitted ${events.length} ticker events`);
  const priorEvents = loadPriorEvents();
  // Merge new events with the tail of the previous file so the ticker
  // doesn't go silent between game days.
  const merged = mergeEvents(events, priorEvents?.events ?? []).slice(
    0,
    MAX_EVENTS,
  );
  writeFileSync(
    EVENTS_PATH,
    JSON.stringify({ events: merged }, null, 2) + '\n',
    'utf8',
  );

  if (rows.length === 0) {
    console.log('[update-stats] 0 rows — leaving existing stats.json intact');
    return;
  }

  const indexed = indexSkaters(rows);
  const { stats, misses } = buildStatsMap(rosters, indexed);

  const payload = {
    lastUpdated: new Date().toISOString(),
    players: stats,
  };

  if (prior && shallowEqualPlayers(prior.players, payload.players)) {
    console.log('[update-stats] no stat changes — skipping stats write');
  } else {
    writeFileSync(STATS_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(
      `[update-stats] wrote ${Object.keys(stats).length} players to stats.json`,
    );
  }

  if (misses.length > 0) {
    console.warn(
      `[update-stats] ${misses.length} pool players had no API match — they will show as 0-0-0:`,
    );
    for (const m of misses) console.warn(`    · ${m}`);
  }
}

/** Dedupe by (player + type + time) and prefer the newer copy. */
function mergeEvents(fresh, old) {
  const seen = new Set();
  const out = [];
  for (const e of [...fresh, ...old]) {
    const key = `${e.type}|${e.player}|${e.time}|${e.pool}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function shallowEqualPlayers(a, b) {
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    const pa = a[k];
    const pb = b[k];
    if (!pb) return false;
    if (pa.gp !== pb.gp || pa.g !== pb.g || pa.a !== pb.a) return false;
  }
  return true;
}

main().catch((err) => {
  console.error('[update-stats] FAILED:', err);
  process.exitCode = 1;
});
