// Small, dependency-free fetch layer for the three static JSON files.
// Each lives in /public/data/ so it's served directly by the CDN — no build
// step is required when the stats cron commits updated files.

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

// Static files that rarely change are served from the Pages CDN (fast, cached).
const PAGES_BASE = `${import.meta.env.BASE_URL}data`.replace(/\/+/g, '/');

// Frequently-updated data files are fetched directly from raw.githubusercontent.com
// so they bypass the Pages build pipeline. Pages only redeploys when source code
// changes; data commits land here within seconds of the cron pushing to main.
const RAW_BASE =
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
