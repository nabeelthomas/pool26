// Small, dependency-free fetch layer for the three static JSON files.
// Each lives in /public/data/ so it's served directly by the CDN — no build
// step is required when the stats cron commits updated files.

import type { EventsFile, RostersFile, StatsFile } from '../types';

export interface PoolData {
  rosters: RostersFile;
  stats: StatsFile;
  events: EventsFile;
  jokes: string[];
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

/** Load all four data files in parallel. Individual failures reject the whole call. */
export async function loadPoolData(): Promise<PoolData> {
  const [rosters, stats, events, jokesFile] = await Promise.all([
    fetchJSON<RostersFile>('/data/rosters.json'),
    fetchJSON<StatsFile>('/data/stats.json'),
    fetchJSON<EventsFile>('/data/events.json'),
    fetchJSON<{ jokes: string[] }>('/data/jokes.json'),
  ]);
  return { rosters, stats, events, jokes: jokesFile.jokes };
}
