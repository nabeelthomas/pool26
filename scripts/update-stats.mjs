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

/**
 * All normalized forms a name could show up as in the NHL API.
 *
 * The gamecenter landing endpoint returns full names for goals
 * ("Ivan Demidov") but abbreviated names for assists ("I. Demidov"),
 * so we produce all three variants and match whichever we find.
 */
function nameVariants(fullName) {
  const full = normalizeName(fullName);
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return [full];
  const first = parts[0];
  const last = parts.slice(1).join(' ');
  return [
    full,
    normalizeName(`${first[0]}. ${last}`), // "i. demidov"
    normalizeName(`${first[0]} ${last}`), // "i demidov" (belt-and-suspenders)
  ];
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
 * Map our roster to summary stats, overlaying in-progress live-game goals
 * and assists. The NHL summary endpoint only includes players whose games
 * have completed — so during Montreal's first playoff game, none of their
 * skaters show up at all. `liveTally` fills that gap.
 *
 * For FINAL games we trust the summary (~10-min lag is acceptable); only
 * LIVE tallies are overlayed here to avoid double-counting once the
 * summary catches up.
 */
function buildStatsMap(rosters, byNormalized, liveTally) {
  const out = {};
  const misses = [];
  for (const manager of rosters.managers) {
    for (const player of manager.roster) {
      const candidates = [player.name, ...(player.aliases ?? [])];

      // Try summary (full-name match only — summary always has full names).
      let summaryHit = null;
      for (const candidate of candidates) {
        const found = byNormalized.get(normalizeName(candidate));
        if (found) {
          summaryHit = found;
          break;
        }
      }

      // Try live tally under full + abbreviated variants.
      let liveG = 0;
      let liveA = 0;
      let liveMatched = false;
      const consumed = new Set();
      for (const candidate of candidates) {
        for (const variant of nameVariants(candidate)) {
          if (consumed.has(variant)) continue;
          const t = liveTally.get(variant);
          if (t) {
            liveG += t.g;
            liveA += t.a;
            liveMatched = true;
            consumed.add(variant);
          }
        }
      }

      if (summaryHit || liveMatched) {
        const base = summaryHit ?? { gp: 0, g: 0, a: 0 };
        out[player.name] = {
          // Bump gp to ≥1 if we're crediting live points; otherwise trust the summary.
          gp: summaryHit ? base.gp : liveMatched ? 1 : 0,
          g: base.g + liveG,
          a: base.a + liveA,
        };
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
      // NHL gameState values we've seen: FUT, PRE, LIVE, CRIT, OFF, FINAL.
      // CRIT = last few minutes / overtime of a close game — treat as LIVE.
      // OFF = game over, waiting for final posting — treat as FINAL.
      const status = g.gameState;
      const normalized =
        status === 'LIVE' || status === 'CRIT'
          ? 'live'
          : status === 'FINAL' || status === 'OFF'
            ? 'final'
            : 'scheduled';
      // Period descriptor for live games: "1st" / "2nd" / "3rd" / "OT" / "SO"
      const pd = g.periodDescriptor;
      const periodNum = pd?.number ?? 0;
      const periodType = pd?.periodType ?? 'REG'; // REG|OT|SO
      let period = null;
      if (normalized === 'live') {
        if (periodType === 'OT') period = 'OT';
        else if (periodType === 'SO') period = 'SO';
        else if (periodNum === 1) period = '1st';
        else if (periodNum === 2) period = '2nd';
        else if (periodNum === 3) period = '3rd';
        else period = `P${periodNum}`;
      } else if (normalized === 'final') {
        // Tag OT/SO final
        if (periodType === 'OT') period = 'OT';
        else if (periodType === 'SO') period = 'SO';
      }
      // CRIT specifically — tag as "LIVE" visually but keep period info above.
      // (Already set via the isLive branch since we map CRIT → live.)
      return {
        id: g.id,
        away: teamCode(g.awayTeam),
        home: teamCode(g.homeTeam),
        awayScore: g.awayTeam?.score ?? null,
        homeScore: g.homeTeam?.score ?? null,
        period,
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
  const add = (key, displayName) => {
    const list = out.get(key) ?? [];
    if (!list.includes(displayName)) list.push(displayName);
    out.set(key, list);
  };
  for (const m of rosters.managers) {
    for (const p of m.roster) {
      const candidates = [p.name, ...(p.aliases ?? [])];
      for (const c of candidates) {
        // Register every form the NHL API might hand us — full name from
        // goals, abbreviated "F. Last" from assists.
        for (const v of nameVariants(c)) add(v, m.displayName);
      }
    }
  }
  return out;
}

/**
 * Walk today's games. Returns:
 *   - events: ticker entries for pool-player goals/primary assists
 *   - liveTally: Map<normalizedNameVariant, { g, a }> counting goals and
 *     assists only for LIVE (in-progress) games. Used to patch over the
 *     NHL summary endpoint's blind spot during in-progress playoff games.
 */
async function walkTodayLandings(games, ownership) {
  const events = [];
  const liveTally = new Map();

  const bump = (key, stat) => {
    const e = liveTally.get(key) ?? { g: 0, a: 0 };
    e[stat] += 1;
    liveTally.set(key, e);
  };

  for (const game of games) {
    if (game.status === 'scheduled') continue;
    let landing;
    try {
      landing = await fetchJSON(GAMECENTER_URL(game.id));
    } catch (err) {
      console.warn(`[update-stats] gamecenter ${game.id} failed:`, err.message);
      continue;
    }
    const isLive = game.status === 'live';
    const periods = landing.summary?.scoring ?? [];

    for (const period of periods) {
      for (const goal of period.goals ?? []) {
        // --- Goal scorer ---
        const scorerName =
          goal.firstName?.default && goal.lastName?.default
            ? `${goal.firstName.default} ${goal.lastName.default}`
            : goal.name?.default ?? '';
        if (scorerName) {
          const scorerKey = normalizeName(scorerName);
          const scorerPool = ownership.get(scorerKey);
          if (scorerPool) {
            events.push({
              type: 'GOAL',
              player: scorerName,
              team: (typeof goal.teamAbbrev === 'string' ? goal.teamAbbrev : goal.teamAbbrev?.default) ?? game.away,
              time: fmtClockET(game.startUTC),
              pool: scorerPool.join(', '),
            });
          }
          if (isLive) bump(scorerKey, 'g');
        }

        // --- Assists (primary → ticker, all → tally) ---
        const assists = goal.assists ?? [];
        for (let i = 0; i < assists.length; i++) {
          const a = assists[i];
          const aName =
            a.firstName?.default && a.lastName?.default
              ? `${a.firstName.default} ${a.lastName.default}`
              : a.name?.default ?? '';
          if (!aName) continue;
          const aKey = normalizeName(aName);

          if (i === 0) {
            const aPool = ownership.get(aKey);
            if (aPool) {
              events.push({
                type: 'ASSIST',
                player: aName,
                team: (typeof goal.teamAbbrev === 'string' ? goal.teamAbbrev : goal.teamAbbrev?.default) ?? game.away,
                time: fmtClockET(game.startUTC),
                pool: aPool.join(', '),
              });
            }
          }
          if (isLive) bump(aKey, 'a');
        }
      }
    }
  }

  return {
    events: events.slice(-MAX_EVENTS).reverse(),
    liveTally,
  };
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
  const { events, liveTally } = await walkTodayLandings(games, ownership);
  console.log(
    `[update-stats] emitted ${events.length} ticker events · ${liveTally.size} live tally keys`,
  );
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

  if (rows.length === 0 && liveTally.size === 0) {
    console.log('[update-stats] 0 rows + no live data — leaving stats.json intact');
    return;
  }

  const indexed = indexSkaters(rows);
  const { stats, misses } = buildStatsMap(rosters, indexed, liveTally);

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
