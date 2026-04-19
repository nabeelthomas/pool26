// Full-screen overlay showing a screenshot-friendly standings card.
// Tap "Share" → a styled 1080×1350-ish view appears, sized for one-tap
// screenshot → drop straight into the group chat. Tap the X to close.
//
// We deliberately don't use html-to-canvas — phones already screenshot
// natively, and the dependency-free approach saves ~50KB and one CVE
// class to track.

import type { ManagerStanding } from '../types';
import { pad2, pad3 } from '../lib/format';

interface ShareCardProps {
  standings: ManagerStanding[];
  roundLabel: string;
  lastUpdated: string;
  onClose: () => void;
}

export function ShareCard({
  standings,
  roundLabel,
  lastUpdated,
  onClose,
}: ShareCardProps) {
  const updatedDate = new Date(lastUpdated).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      role="dialog"
      aria-label="Shareable standings card"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close share card"
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          width: 44,
          height: 44,
          background: 'var(--rp-wood-dark)',
          color: 'var(--rp-paper)',
          border: '3px solid var(--rp-paper)',
          fontFamily: 'Alfa Slab One, serif',
          fontSize: 22,
          cursor: 'pointer',
          zIndex: 1002,
        }}
      >
        ×
      </button>

      {/* The card — sized to screenshot well in portrait. */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background:
            'linear-gradient(180deg, #2b1810 0%, #1a0e05 100%)',
          border: '6px solid #c6ff3d',
          boxShadow: '0 0 40px rgba(198,255,61,0.4), 0 12px 32px rgba(0,0,0,0.7)',
          padding: 24,
          color: 'var(--rp-paper)',
          fontFamily: 'DM Mono, monospace',
        }}
      >
        <div
          className="rp-display"
          style={{
            textAlign: 'center',
            fontSize: 38,
            color: 'var(--rp-red-neon)',
            textShadow:
              '0 0 8px var(--rp-red-neon), 0 0 18px var(--rp-red-neon)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Pool '26
        </div>
        <div
          className="rp-mono"
          style={{
            textAlign: 'center',
            fontSize: 11,
            letterSpacing: '0.3em',
            color: 'var(--rp-cyan)',
            textShadow: '0 0 4px var(--rp-cyan)',
            marginTop: 6,
            marginBottom: 18,
            textTransform: 'uppercase',
          }}
        >
          ◆ {roundLabel} ◆ Standings
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 56px 40px 40px',
            gap: 4,
            padding: '6px 8px',
            borderBottom: '1px dashed rgba(198,255,61,0.5)',
            fontSize: 11,
            color: 'var(--rp-lime)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ textAlign: 'center' }}>#</span>
          <span>Manager</span>
          <span style={{ textAlign: 'right' }}>PTS</span>
          <span style={{ textAlign: 'right' }}>G</span>
          <span style={{ textAlign: 'right' }}>A</span>
        </div>

        {standings.map((m, i) => {
          const rank = i + 1;
          return (
            <div
              key={m.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr 56px 40px 40px',
                gap: 4,
                padding: '8px',
                fontFamily: 'VT323, monospace',
                background: i % 2 ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderLeft: rank === 1 ? '4px solid var(--rp-amber)' : '4px solid transparent',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  textAlign: 'center',
                  fontSize: 22,
                  color: rank === 1 ? 'var(--rp-amber)' : 'var(--rp-lime)',
                  textShadow: rank === 1 ? '0 0 4px var(--rp-amber)' : 'none',
                }}
              >
                {pad2(rank)}
              </span>
              <span
                style={{
                  fontSize: 22,
                  color: 'var(--rp-paper)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {rank === 1 && '♛ '}
                {m.displayName}
              </span>
              <span
                style={{
                  textAlign: 'right',
                  fontSize: 22,
                  color: 'var(--rp-red-neon)',
                  textShadow: '0 0 4px var(--rp-red-neon)',
                }}
              >
                {pad3(m.totals.points)}
              </span>
              <span style={{ textAlign: 'right', fontSize: 18, color: 'var(--rp-lime)' }}>
                {pad2(m.totals.g)}
              </span>
              <span style={{ textAlign: 'right', fontSize: 18, color: 'var(--rp-lime)' }}>
                {pad2(m.totals.a)}
              </span>
            </div>
          );
        })}

        <div
          className="rp-mono"
          style={{
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'var(--rp-muted)',
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px dashed rgba(255,255,255,0.15)',
            textTransform: 'uppercase',
          }}
        >
          Updated {updatedDate} ET · nabeelthomas.github.io/pool26
        </div>
      </div>
    </div>
  );
}
