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

async function main() {
  const rosters = loadRosters();
  const prior = loadPriorStats();

  console.log('[update-stats] fetching playoff skater summary…');
  const rows = await fetchAllPlayoffSkaters();
  console.log(`[update-stats] received ${rows.length} skaters`);

  if (rows.length === 0) {
    // Playoffs haven't started yet, or the endpoint temporarily returned
    // nothing. Don't overwrite existing good data.
    console.log('[update-stats] 0 rows — leaving existing stats.json intact');
    return;
  }

  const indexed = indexSkaters(rows);
  const { stats, misses } = buildStatsMap(rosters, indexed);

  const payload = {
    lastUpdated: new Date().toISOString(),
    players: stats,
  };

  // If nothing changed, skip writing so CI doesn't make an empty commit.
  if (prior && shallowEqualPlayers(prior.players, payload.players)) {
    console.log('[update-stats] no stat changes — skipping write');
    return;
  }

  writeFileSync(STATS_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(
    `[update-stats] wrote ${Object.keys(stats).length} players to stats.json`,
  );

  if (misses.length > 0) {
    console.warn(
      `[update-stats] ${misses.length} pool players had no API match — they will show as 0-0-0:`,
    );
    for (const m of misses) console.warn(`    · ${m}`);
  }
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
