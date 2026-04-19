// Pure functions that join rosters × stats → standings.
// Kept dependency-free so we could unit-test or call server-side if needed.

import type {
  Manager,
  ManagerStanding,
  PlayerStats,
  RosterPlayerWithStats,
  RostersFile,
  ScoringConfig,
  StatsFile,
} from '../types';

const EMPTY_STATS: PlayerStats = { gp: 0, g: 0, a: 0 };

/**
 * Look up a player's stats by their primary name or any declared alias.
 * Falls back to zero stats if we can't find a match — the roster renders
 * as "0-0-0" rather than crashing when the stats file is stale.
 */
function lookupStats(
  primary: string,
  aliases: readonly string[] | undefined,
  stats: StatsFile['players'],
): PlayerStats {
  if (stats[primary]) return stats[primary];
  if (aliases) {
    for (const alias of aliases) {
      if (stats[alias]) return stats[alias];
    }
  }
  return EMPTY_STATS;
}

/** Compute points under the current scoring rules (G=1, A=1 for 2026). */
export function pointsFor(stats: PlayerStats, scoring: ScoringConfig): number {
  return stats.g * scoring.goal + stats.a * scoring.assist;
}

/** Join a manager's roster with the current stats snapshot. */
export function attachStats(
  manager: Manager,
  stats: StatsFile['players'],
  scoring: ScoringConfig,
): RosterPlayerWithStats[] {
  return manager.roster.map((player) => {
    const playerStats = lookupStats(player.name, player.aliases, stats);
    return {
      ...player,
      stats: playerStats,
      points: pointsFor(playerStats, scoring),
    };
  });
}

/**
 * Compute totals and derived shape for every manager.
 * Does NOT sort — callers decide sort order (points desc is the default).
 */
export function computeStandings(
  rosters: RostersFile,
  stats: StatsFile,
): ManagerStanding[] {
  return rosters.managers.map((manager) => {
    const rosterStats = attachStats(manager, stats.players, rosters.scoring);
    const totals = rosterStats.reduce<PlayerStats & { points: number }>(
      (acc, player) => ({
        gp: acc.gp + player.stats.gp,
        g: acc.g + player.stats.g,
        a: acc.a + player.stats.a,
        points: acc.points + player.points,
      }),
      { gp: 0, g: 0, a: 0, points: 0 },
    );
    return { ...manager, rosterStats, totals };
  });
}

export type SortKey = 'points' | 'g' | 'a' | 'gp';

/** Sort standings by a totals key (descending). Stable for ties → keeps roster order. */
export function sortStandings(
  standings: readonly ManagerStanding[],
  sortKey: SortKey,
): ManagerStanding[] {
  return [...standings].sort((a, b) => b.totals[sortKey] - a.totals[sortKey]);
}

/**
 * Map of player name → list of manager display names who rostered them.
 * Built once at load time and passed down into the roster view.
 */
export type OwnershipMap = Record<string, string[]>;

export function buildOwnershipMap(rosters: RostersFile): OwnershipMap {
  const out: OwnershipMap = {};
  for (const manager of rosters.managers) {
    for (const player of manager.roster) {
      const list = out[player.name] ?? (out[player.name] = []);
      list.push(manager.displayName);
    }
  }
  return out;
}

/**
 * Snapshot used for "what changed since you last looked".
 * Only stores totals — that's all the visit-to-visit diff needs.
 */
export interface StandingsSnapshot {
  takenAt: string; // ISO
  totalsById: Record<string, PlayerStats & { points: number }>;
}

export function snapshotFromStandings(
  standings: readonly ManagerStanding[],
): StandingsSnapshot {
  const totalsById: StandingsSnapshot['totalsById'] = {};
  for (const s of standings) totalsById[s.id] = { ...s.totals };
  return { takenAt: new Date().toISOString(), totalsById };
}
