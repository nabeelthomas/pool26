// The "Big TV" leaderboard — a CRT-styled scoreboard that lists all
// managers by points. Click a row → parent updates the selected manager.
// Click a column header → parent re-sorts.
//
// All CRT chrome (bezel, speaker, brand plate, scanlines, phosphor glow)
// is drawn with CSS so we ship no PNG bezel assets.

import type { ManagerStanding } from '../types';
import type { SortKey } from '../lib/standings';
import { pad2, pad3, timeAgo } from '../lib/format';
import { SCANLINES_CSS } from '../lib/textures';

interface LeaderboardProps {
  standings: ManagerStanding[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  /** ISO timestamp of the last cron run (from schedule.json#generatedAt). */
  lastCronRun: string;
  /** ISO timestamp of when player stats last actually changed. */
  lastUpdated: string;
  /** Season/round label shown in the CRT header. */
  roundLabel?: string;
  /** Per-manager points delta since the user last visited (positive int or 0). */
  pointsSinceLastVisit?: Record<string, number>;
}

const HEADER_COLS: Array<{ label: string; key: SortKey | null; align: 'center' | 'left' | 'right' }> = [
  { label: 'RNK', key: null, align: 'center' },
  { label: 'MANAGER', key: null, align: 'left' },
  { label: 'PTS', key: 'points', align: 'right' },
  { label: 'G', key: 'g', align: 'right' },
  { label: 'A', key: 'a', align: 'right' },
  { label: 'GP', key: 'gp', align: 'right' },
];

export function Leaderboard({
  standings,
  selectedId,
  onSelect,
  sortKey,
  setSortKey,
  lastCronRun,
  lastUpdated,
  roundLabel = 'Playoffs',
  pointsSinceLastVisit,
}: LeaderboardProps) {
  const leader = standings[0];
  const leadBy =
    standings.length > 1
      ? (leader?.totals.points ?? 0) - (standings[1]?.totals.points ?? 0)
      : 0;

  return (
    <div
      className="pool-crt"
      style={{
        // Final design spec: 500 screen + 22 bezel × 2 = 544 wide.
        width: '100%',
        maxWidth: 544,
        filter: 'drop-shadow(0 24px 32px rgba(0,0,0,0.7))',
      }}
    >
      {/* TV bezel — drawn in CSS, no PNGs */}
      <div
        style={{
          position: 'relative',
          background:
            'linear-gradient(180deg, #3a3a3c 0%, #2a2a2c 40%, #1a1a1c 100%)',
          borderRadius: 10,
          border: '2px solid #0c0c0e',
          boxShadow:
            'inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -3px 8px rgba(0,0,0,0.5), 0 0 0 2px rgba(0,0,0,0.4)',
          padding: 22,
          paddingBottom: 46,
          boxSizing: 'border-box',
          minHeight: 380 + 22 + 46, // SCREEN_H + BEZEL + BEZEL_BOT
        }}
      >
        {/* Speaker grille dots */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 30,
            bottom: 10,
            display: 'flex',
            gap: 4,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--rp-red-neon)',
              boxShadow: '0 0 4px var(--rp-red-neon)',
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#1a1a1c',
              border: '1px solid #0a0a0c',
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#1a1a1c',
              border: '1px solid #0a0a0c',
            }}
          />
        </div>
        {/* Brand plate */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 30,
            bottom: 12,
            fontFamily: 'VT323, monospace',
            fontSize: 14,
            color: '#6a6a6c',
            letterSpacing: '0.15em',
          }}
        >
          ZENITH · COLOR
        </div>

        {/* Phosphor screen */}
        <div
          style={{
            position: 'relative',
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(26,58,42,0.95) 0%, rgba(10,24,16,0.95) 50%, rgba(5,10,8,0.95) 100%)',
            overflow: 'hidden',
            borderRadius: 10,
            boxShadow:
              'inset 0 0 30px rgba(0,0,0,0.9), inset 0 0 80px rgba(0,0,0,0.5), 0 0 0 3px #0a0a0c',
            padding: '18px 22px 14px',
            color: 'var(--rp-lime)',
            fontFamily: 'DM Mono, monospace',
            minHeight: 360,
          }}
        >
          {/* Header strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              borderBottom: '1px dashed rgba(198,255,61,0.35)',
              paddingBottom: 6,
              marginBottom: 8,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div
              className="rp-led"
              style={{
                fontSize: 26,
                color: 'var(--rp-lime)',
                textShadow:
                  '0 0 4px var(--rp-lime), 0 0 12px rgba(198,255,61,0.6)',
              }}
            >
              ◆ POOL '26 · {roundLabel.toUpperCase()} ◆
            </div>
            <div
              className="rp-led rp-flicker"
              style={{
                fontSize: 20,
                color: 'var(--rp-red-neon)',
                textShadow: '0 0 4px var(--rp-red-neon)',
              }}
              aria-live="polite"
            >
              ● LIVE · {timeAgo(lastCronRun).toUpperCase()} AGO · LAST PT: {timeAgo(lastUpdated).toUpperCase()} AGO
            </div>
          </div>

          {/* Leader strip */}
          {leader && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 10px',
                marginBottom: 8,
                background: 'rgba(198,255,61,0.08)',
                border: '1px solid rgba(198,255,61,0.3)',
                flexWrap: 'wrap',
              }}
            >
              <span
                className="rp-led"
                style={{
                  fontSize: 22,
                  color: 'var(--rp-amber)',
                  textShadow: '0 0 4px var(--rp-amber)',
                }}
              >
                ♛ LEADER
              </span>
              <span
                className="rp-led"
                style={{
                  fontSize: 24,
                  color: 'var(--rp-paper)',
                  textShadow: '0 0 4px var(--rp-paper)',
                }}
              >
                {leader.displayName.toUpperCase()}
              </span>
              <span style={{ flex: 1 }} />
              <span
                className="rp-led"
                style={{
                  fontSize: 26,
                  color: 'var(--rp-lime)',
                  textShadow: '0 0 4px var(--rp-lime)',
                }}
              >
                {leader.totals.points} PTS
              </span>
              {leadBy > 0 && (
                <span
                  className="rp-led"
                  style={{ fontSize: 18, color: 'var(--rp-amber)' }}
                >
                  +{leadBy}
                </span>
              )}
            </div>
          )}

          {/* Column headers — clickable where sortable */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 64px 48px 48px 48px',
              gap: 6,
              alignItems: 'center',
              padding: '4px 8px',
              fontFamily: 'VT323, monospace',
              fontSize: 16,
              color: '#5a8a5a',
              borderBottom: '1px dashed rgba(198,255,61,0.3)',
              letterSpacing: '0.05em',
            }}
          >
            {HEADER_COLS.map((col) => {
              const active = col.key !== null && sortKey === col.key;
              return (
                <button
                  key={col.label}
                  type="button"
                  onClick={() => col.key && setSortKey(col.key)}
                  disabled={col.key === null}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: active ? 'var(--rp-lime)' : '#5a8a5a',
                    textShadow: active ? '0 0 4px var(--rp-lime)' : 'none',
                    textAlign: col.align,
                    fontFamily: 'VT323, monospace',
                    fontSize: 16,
                    cursor: col.key ? 'pointer' : 'default',
                    letterSpacing: '0.05em',
                  }}
                >
                  {col.label}
                  {active ? ' ▼' : ''}
                </button>
              );
            })}
          </div>

          {/* Standings rows */}
          <div>
            {standings.map((manager, i) => {
              const rank = i + 1;
              const isSelected = manager.id === selectedId;
              // Gap to the row above (positive value, undefined for first row).
              const gapAbove = i === 0 ? null : standings[i - 1].totals.points - manager.totals.points;
              const delta = pointsSinceLastVisit?.[manager.id] ?? 0;
              return (
                <button
                  key={manager.id}
                  type="button"
                  onClick={() => onSelect(manager.id)}
                  className="rp-row"
                  style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 64px 48px 48px 48px',
                    gap: 6,
                    alignItems: 'center',
                    padding: '5px 8px',
                    fontFamily: 'VT323, monospace',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(198,255,61,0.18)'
                      : i % 2
                        ? 'rgba(198,255,61,0.04)'
                        : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid var(--rp-red-neon)'
                      : '3px solid transparent',
                    border: 'none',
                    borderLeftWidth: 3,
                    borderLeftStyle: 'solid',
                    borderLeftColor: isSelected ? 'var(--rp-red-neon)' : 'transparent',
                    color: 'var(--rp-lime)',
                    textAlign: 'left',
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${manager.displayName}, rank ${rank}, ${manager.totals.points} points`}
                >
                  <span
                    style={{
                      textAlign: 'center',
                      fontSize: 22,
                      color: rank === 1 ? 'var(--rp-amber)' : '#5a8a5a',
                      textShadow: rank === 1 ? '0 0 4px var(--rp-amber)' : 'none',
                    }}
                  >
                    {pad2(rank)}
                  </span>
                  <span
                    style={{
                      fontSize: 22,
                      color: isSelected ? 'var(--rp-paper)' : 'var(--rp-lime)',
                      textShadow: '0 0 3px currentColor',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {rank === 1 && '♛ '}
                      {manager.displayName}
                    </span>
                    {gapAbove !== null && gapAbove > 0 && (
                      <span
                        title={`${gapAbove} pts behind ${standings[i - 1].displayName}`}
                        style={{
                          fontSize: 12,
                          color: '#5a8a5a',
                          letterSpacing: '0.05em',
                          textShadow: 'none',
                        }}
                      >
                        −{gapAbove}
                      </span>
                    )}
                    {delta > 0 && (
                      <span
                        title="Points scored since your last visit"
                        style={{
                          fontSize: 11,
                          color: 'var(--rp-amber)',
                          background: 'rgba(255,159,28,0.15)',
                          border: '1px solid rgba(255,159,28,0.6)',
                          padding: '0 4px',
                          letterSpacing: '0.05em',
                          textShadow: '0 0 4px var(--rp-amber)',
                          borderRadius: 2,
                        }}
                      >
                        +{delta}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      fontSize: 24,
                      color: 'var(--rp-red-neon)',
                      textShadow: '0 0 4px var(--rp-red-neon)',
                    }}
                  >
                    {pad3(manager.totals.points)}
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      fontSize: 20,
                      color: 'var(--rp-lime)',
                      textShadow: '0 0 3px rgba(198,255,61,0.6)',
                    }}
                  >
                    {pad2(manager.totals.g)}
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      fontSize: 20,
                      color: 'var(--rp-lime)',
                      textShadow: '0 0 3px rgba(198,255,61,0.6)',
                    }}
                  >
                    {pad2(manager.totals.a)}
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      fontSize: 20,
                      color: 'var(--rp-cyan)',
                      textShadow: '0 0 3px rgba(45,212,247,0.6)',
                    }}
                  >
                    {pad2(manager.totals.gp)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scanlines */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: SCANLINES_CSS,
              opacity: 0.5,
              mixBlendMode: 'multiply',
              zIndex: 5,
            }}
          />
          {/* Phosphor vignette */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
              zIndex: 6,
            }}
          />
          {/* Glass reflection highlight */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '60%',
              height: '50%',
              pointerEvents: 'none',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 60%)',
              zIndex: 7,
            }}
          />
          {/* VHS tracking band */}
          <div
            aria-hidden
            className="rp-vhs"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 6,
              top: '40%',
              background: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
              zIndex: 7,
            }}
          />
        </div>
      </div>

      {/* Stand — plain dark rectangle */}
      <div
        aria-hidden
        style={{
          width: '100%',
          height: 40,
          background:
            'linear-gradient(180deg, #2a2a2c 0%, #15151a 100%)',
          border: '2px solid #0c0c0e',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          boxShadow:
            'inset 0 2px 6px rgba(0,0,0,0.6), 0 12px 24px rgba(0,0,0,0.7)',
        }}
      />
    </div>
  );
}
