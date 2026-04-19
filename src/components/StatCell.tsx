// Small scoreboard-style stat cell — label on top (micro), big LED digit
// below. Used in player rows and manager-row compact stats.

import { pad2 } from '../lib/format';

interface StatCellProps {
  label: string;
  value: number;
  /** Text glow color — defaults to lime. */
  color?: string;
  /** Pad to 2 digits (default) or render raw. */
  pad?: boolean;
  /** Size preset. `sm` is used in dense leaderboard rows. */
  size?: 'sm' | 'md';
}

export function StatCell({
  label,
  value,
  color = 'var(--rp-lime)',
  pad = true,
  size = 'md',
}: StatCellProps) {
  const isSm = size === 'sm';
  return (
    <div style={{ textAlign: 'center', flexShrink: 0 }}>
      <div
        className="rp-mono"
        style={{
          fontSize: isSm ? 7 : 8,
          letterSpacing: '0.15em',
          color: 'var(--rp-muted)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        className="rp-led"
        style={{
          fontSize: isSm ? 16 : 22,
          color,
          lineHeight: 1.1,
          textShadow: `0 0 4px ${color}88`,
          background: 'var(--rp-wood-dark)',
          padding: isSm ? '1px 4px' : '2px 5px',
          minWidth: isSm ? 22 : 28,
          border: '1px solid var(--rp-bg)',
        }}
      >
        {pad ? pad2(value) : value}
      </div>
    </div>
  );
}
