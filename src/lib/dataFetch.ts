// Small, dependency-free fetch layer for the static JSON files in public/data.
//
// Two-origin split — read this before adding a new data file:
//
//   • Pages CDN (PAGES_BASE) — used for files that change only on a real
//     source-code or content commit: rosters.json, jokes.json. Fast, cached.
//   • raw.githubusercontent.com (RAW_BASE) — used for files the cron rewrites
//     every 2 min: stats.json, events.json, schedule.json. Bypasses the Pages
//     build pipeline, which would otherwise rebuild on every cron commit and
//     thrash with cancel-in-progress.
//
// raw.githubusercontent.com sets Cache-Control: max-age=300, so even with the
// per-minute cache-buster query string the practical freshness floor is
// minute-granularity (a fresh URL each minute → bypasses the 5-min CDN cache).
//
// Hidden coupling: RAW_BASE only works while the GitHub repo is public. If
// the repo is ever flipped private, every live-data fetch silently 404s.

import type { EventsFile, RostersFile, StatsFile } from '../types';

export interface PoolData {
  rosters: RostersFile;
  stats: StatsFile;
  events: EventsFile;
  jokes: string[];
  /** ISO timestamp of the last cron run — from schedule.json#generatedAt. */
  lastCronRun: string;
}

const withCacheBuster = (path: string): string => {
  // Bust CDN caches for the two files that refresh during the day.
  // rosters is effectively static so we let it cache normally.
  if (path.endsWith('rosters.json') || path.endsWith('jokes.json')) return path;
  return `${path}?t=${Math.floor(Date.now() / 60_000)}`;
};

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(withCacheBuster(path), { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// See file header for why these are split.
export const PAGES_BASE = `${import.meta.env.BASE_URL}data`.replace(/\/+/g, '/');
export const RAW_BASE =
  'https://raw.githubusercontent.com/nabeelthomas/pool26/main/public/data';

/** Load all data files in parallel. Individual failures reject the whole call. */
export async function loadPoolData(): Promise<PoolData> {
  const [rosters, stats, events, jokesFile, scheduleFile] = await Promise.all([
    fetchJSON<RostersFile>(`${PAGES_BASE}/rosters.json`),
    fetchJSON<StatsFile>(`${RAW_BASE}/stats.json`),
    fetchJSON<EventsFile>(`${RAW_BASE}/events.json`),
    fetchJSON<{ jokes: string[] }>(`${PAGES_BASE}/jokes.json`),
    fetchJSON<{ generatedAt: string }>(`${RAW_BASE}/schedule.json`),
  ]);
  return {
    rosters,
    stats,
    events,
    jokes: jokesFile.jokes,
    lastCronRun: scheduleFile.generatedAt,
  };
}
