// Shared types for Pool '26.
// `rosters.json`, `stats.json`, and `events.json` all conform to these shapes.

export type Position = 'F' | 'D';
/** Roster-level event kinds that can appear in the ticker. */
export type EventKind = 'GOAL' | 'ASSIST' | 'HATTY' | 'CAWWW';

export interface TeamInfo {
  /** Full team name, e.g. "Oilers". */
  name: string;
  /** Primary team color as `#rrggbb`. */
  color: string;
}

export interface RosterPlayer {
  /** Player name. Used as the join key to stats. */
  name: string;
  /** Three-letter team code (may change mid-playoffs for traded players). */
  team: string;
  pos: Position;
  /**
   * Alternate spellings to try when matching NHL API responses.
   * Example: Stutzle vs. Stützle. Empty array if none.
   */
  aliases?: string[];
}

export interface Manager {
  /** Stable slug used as the selection key. */
  id: string;
  /** Display name shown in the UI. */
  displayName: string;
  /** Short handle shown under the display name. */
  handle: string;
  /** One-liner shown in the leaderboard row and roster panel. */
  motto: string;
  /** Accent color for this manager's roster panel header. */
  color: string;
  /** List of drafted players (15 per manager, F/D only in 2026). */
  roster: RosterPlayer[];
}

export interface ScoringConfig {
  /** Points per goal scored. */
  goal: number;
  /** Points per assist. */
  assist: number;
}

export interface RostersFile {
  season: string;
  /** Optional label, e.g. "Round 1" or "Playoffs". */
  round?: string;
  scoring: ScoringConfig;
  teams: Record<string, TeamInfo>;
  managers: Manager[];
}

export interface PlayerStats {
  /** Games played. */
  gp: number;
  g: number;
  a: number;
}

export interface StatsFile {
  /** ISO timestamp of the last successful refresh. */
  lastUpdated: string;
  /** Map keyed by player name. Zeroed until playoffs start. */
  players: Record<string, PlayerStats>;
}

export interface TickerEvent {
  type: Exclude<EventKind, 'CAWWW'>;
  player: string;
  team: string;
  /** E.g. "8:47 PM ET". */
  time: string;
  /** Comma-separated list of manager display names who rostered this player. */
  pool: string;
}

export interface EventsFile {
  events: TickerEvent[];
}

// ─── Derived / runtime shapes ──────────────────────────────────────────

/** A roster player with their current stats joined in. */
export interface RosterPlayerWithStats extends RosterPlayer {
  stats: PlayerStats;
  /** Computed points under the current scoring config. */
  points: number;
}

/** A manager with computed totals and joined-stats roster. */
export interface ManagerStanding extends Manager {
  rosterStats: RosterPlayerWithStats[];
  totals: PlayerStats & { points: number };
}
