// Paper-textured side panel showing the selected manager's roster,
// sorted by points descending. Includes a totals strip and motto pennant.

import type { ManagerStanding, TeamInfo } from '../types';
import { PlayerRow } from './PlayerRow';
import { PAPER_URL } from '../lib/textures';
import { pad2, pad3 } from '../lib/format';

interface RosterPanelProps {
  manager: ManagerStanding | null;
  teams: Record<string, TeamInfo>;
  onClose?: () => void;
}

/**
 * Pick a readable text color for the colored header.
 * Bright / warm accent colors pair with dark text; dark accents pair
 * with paper. Handles the six manager colors we ship with today.
 */
function textForAccent(color: string): string {
  const light = new Set(['#c6ff3d', '#ebddb8', '#b4975a', '#2dd4f7', '#ff9f1c']);
  return light.has(color.toLowerCase()) ? 'var(--rp-wood)' : 'var(--rp-paper)';
}

export function RosterPanel({ manager, teams, onClose }: RosterPanelProps) {
  if (!manager) {
    return (
      <div
        style={{
          backgroundImage: PAPER_URL,
          backgroundColor: 'var(--rp-paper)',
          border: '4px double var(--rp-wood)',
          boxShadow: '6px 6px 0 var(--rp-wood-dark)',
          padding: '24px 20px',
          textAlign: 'center',
          color: 'var(--rp-muted-dark)',
          fontFamily: 'DM Mono, monospace',
          fontSize: 13,
          fontStyle: 'italic',
        }}
      >
        Tap a manager on the left to see their roster.
      </div>
    );
  }

  const sortedRoster = [...manager.rosterStats].sort((a, b) => b.points - a.points);
  const headerColor = manager.color;
  const headerText = textForAccent(headerColor);

  return (
    <div
      style={{
        backgroundImage: PAPER_URL,
        backgroundColor: 'var(--rp-paper)',
        border: '4px double var(--rp-wood)',
        boxShadow: '6px 6px 0 var(--rp-wood-dark)',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Colored manager header */}
      <div
        style={{
          background: headerColor,
          padding: '14px 16px',
          borderBottom: '3px solid var(--rp-wood)',
          color: headerText,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="rp-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                opacity: 0.7,
                marginBottom: 4,
              }}
            >
              ◆ TEAM ROSTER ◆
            </div>
            <div
              className="rp-display"
              style={{
                fontSize: 28,
                lineHeight: 1,
                textTransform: 'uppercase',
                textShadow: '2px 2px 0 rgba(0,0,0,0.35)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {manager.displayName}
            </div>
            <div
              className="rp-mono"
              style={{
                fontSize: 11,
                marginTop: 4,
                fontStyle: 'italic',
                opacity: 0.85,
              }}
            >
              @{manager.handle}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--rp-wood-dark)',
                color: 'var(--rp-paper)',
                border: '3px solid var(--rp-paper)',
                fontFamily: 'Alfa Slab One, serif',
                fontSize: 14,
                width: 36,
                height: 36,
                cursor: 'pointer',
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
              aria-label="Close roster"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Totals strip */}
      <div
        style={{
          background: 'var(--rp-wood-dark)',
          padding: '12px 16px',
          borderBottom: '3px solid var(--rp-wood)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="rp-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'var(--rp-muted)',
              textTransform: 'uppercase',
            }}
          >
            Total PTS
          </div>
          <div
            className="rp-led"
            style={{
              fontSize: 38,
              color: 'var(--rp-red-neon)',
              lineHeight: 1,
              textShadow:
                '0 0 8px var(--rp-red-neon), 0 0 16px var(--rp-red-neon)',
            }}
          >
            {pad3(manager.totals.points)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            className="rp-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'var(--rp-muted)',
              textTransform: 'uppercase',
            }}
          >
            Goals
          </div>
          <div
            className="rp-led"
            style={{
              fontSize: 28,
              color: 'var(--rp-lime)',
              textShadow: '0 0 6px var(--rp-lime)',
            }}
          >
            {pad2(manager.totals.g)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            className="rp-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'var(--rp-muted)',
              textTransform: 'uppercase',
            }}
          >
            Assists
          </div>
          <div
            className="rp-led"
            style={{
              fontSize: 28,
              color: 'var(--rp-lime)',
              textShadow: '0 0 6px var(--rp-lime)',
            }}
          >
            {pad2(manager.totals.a)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            className="rp-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: 'var(--rp-muted)',
              textTransform: 'uppercase',
            }}
          >
            Games
          </div>
          <div
            className="rp-led"
            style={{
              fontSize: 28,
              color: 'var(--rp-cyan)',
              textShadow: '0 0 6px var(--rp-cyan)',
            }}
          >
            {manager.totals.gp}
          </div>
        </div>
      </div>

      {/* Motto */}
      {manager.motto && (
        <div
          style={{
            padding: '10px 16px 4px',
            background: 'var(--rp-paper-shadow)',
            borderBottom: '2px solid var(--rp-wood)',
          }}
        >
          <div
            className="rp-mono"
            style={{
              fontSize: 11,
              color: 'var(--rp-muted-dark)',
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            ★ "{manager.motto}" ★
          </div>
        </div>
      )}

      {/* Roster header */}
      <div
        style={{
          padding: '6px 10px',
          background: 'var(--rp-olive)',
          color: 'var(--rp-paper)',
          display: 'grid',
          gridTemplateColumns: '28px 40px 1fr auto',
          gap: 8,
          borderBottom: '2px solid var(--rp-wood)',
        }}
      >
        <div
          className="rp-mono"
          style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}
        >
          #
        </div>
        <div
          className="rp-mono"
          style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}
        >
          TM
        </div>
        <div
          className="rp-mono"
          style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}
        >
          Player
        </div>
        <div
          className="rp-mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.15em',
            textAlign: 'right',
            textTransform: 'uppercase',
          }}
        >
          G / A / PTS / GP
        </div>
      </div>

      {/* Roster list */}
      <div
        className="rp-scroll"
        style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}
      >
        {sortedRoster.map((player, i) => (
          <PlayerRow
            key={player.name}
            player={player}
            rank={i + 1}
            teams={teams}
          />
        ))}
      </div>
    </div>
  );
}
