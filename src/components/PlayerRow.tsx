// One row in the roster panel — team chip, name, position, and compact stats.

import type { RosterPlayerWithStats, TeamInfo } from '../types';
import { StatCell } from './StatCell';
import { pad2 } from '../lib/format';

interface PlayerRowProps {
  player: RosterPlayerWithStats;
  rank: number;
  teams: Record<string, TeamInfo>;
}

export function PlayerRow({ player, rank, teams }: PlayerRowProps) {
  const team = teams[player.team];
  const teamColor = team?.color ?? 'var(--rp-olive)';
  const teamName = team?.name ?? player.team;
  const isHot = player.points >= 6;
  const isCold = player.points === 0 && player.stats.gp >= 2;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 40px 1fr auto',
        gap: 8,
        alignItems: 'center',
        padding: '8px 10px',
        background: rank % 2 === 0 ? 'rgba(44,24,16,0.04)' : 'transparent',
        borderBottom: '1px dashed #8b7a58',
      }}
    >
      <div
        className="rp-led"
        style={{
          fontSize: 20,
          color: isHot
            ? 'var(--rp-red-neon)'
            : isCold
              ? 'var(--rp-muted-dark)'
              : 'var(--rp-olive)',
          textAlign: 'center',
        }}
      >
        {pad2(rank)}
      </div>
      <div
        style={{
          background: teamColor,
          color: 'var(--rp-paper)',
          fontFamily: 'Alfa Slab One, serif',
          fontSize: 11,
          padding: '3px 0',
          textAlign: 'center',
          border: '2px solid var(--rp-wood)',
          letterSpacing: '0.05em',
        }}
        title={teamName}
      >
        {player.team}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          className="rp-display"
          style={{
            fontSize: 14,
            color: 'var(--rp-wood)',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isHot && (
            <span title="hot" style={{ color: 'var(--rp-red-neon)' }}>
              ▲
            </span>
          )}
          {isCold && (
            <span title="cold" style={{ color: 'var(--rp-cyan)' }}>
              ❄
            </span>
          )}
          {player.name}
        </div>
        <div
          className="rp-mono"
          style={{
            fontSize: 9,
            color: 'var(--rp-muted-dark)',
            letterSpacing: '0.1em',
            marginTop: 1,
          }}
        >
          {player.pos} · {teamName}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
        <StatCell label="G" value={player.stats.g} size="sm" />
        <StatCell label="A" value={player.stats.a} size="sm" />
        <StatCell
          label="PTS"
          value={player.points}
          color="var(--rp-red-neon)"
          size="sm"
        />
        <StatCell
          label="GP"
          value={player.stats.gp}
          color="var(--rp-cyan)"
          size="sm"
        />
      </div>
    </div>
  );
}
