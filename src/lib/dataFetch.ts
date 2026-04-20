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

// Vite injects the configured base ("/pool26/" on Pages, "/" in dev) here
// so the same code works locally and on the deployed subpath.
const DATA_BASE = `${import.meta.env.BASE_URL}data`.replace(/\/+/g, '/');

/** Load all data files in parallel. Individual failures reject the whole call. */
export async function loadPoolData(): Promise<PoolData> {
  const [rosters, stats, events, jokesFile, scheduleFile] = await Promise.all([
    fetchJSON<RostersFile>(`${DATA_BASE}/rosters.json`),
    fetchJSON<StatsFile>(`${DATA_BASE}/stats.json`),
    fetchJSON<EventsFile>(`${DATA_BASE}/events.json`),
    fetchJSON<{ jokes: string[] }>(`${DATA_BASE}/jokes.json`),
    fetchJSON<{ generatedAt: string }>(`${DATA_BASE}/schedule.json`),
  ]);
  return {
    rosters,
    stats,
    events,
    jokes: jokesFile.jokes,
    lastCronRun: scheduleFile.generatedAt,
  };
}
