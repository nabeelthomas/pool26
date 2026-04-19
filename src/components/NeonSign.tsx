// Neon "sign in the basement" — black chassis + glowing text + subtle
// cyan subline. Buzz + flicker animations come from globals.css.

import type { CSSProperties } from 'react';

interface NeonSignProps {
  text: string;
  sub?: string;
  /** Any hex — sets both the text color and its glow. */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FONT_SIZES: Record<NonNullable<NeonSignProps['size']>, number> = {
  sm: 22,
  md: 36,
  lg: 54,
};

export function NeonSign({
  text,
  sub,
  color = 'var(--rp-red-neon)',
  size = 'md',
  className,
}: NeonSignProps) {
  const fontSize = FONT_SIZES[size];
  const signStyle: CSSProperties = {
    color,
    fontSize,
    lineHeight: 1,
    letterSpacing: '0.04em',
    textShadow: `0 0 6px ${color}, 0 0 14px ${color}, 0 0 28px ${color}aa`,
    textTransform: 'uppercase',
  };
  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        padding: '14px 22px',
        background: 'rgba(0,0,0,0.55)',
        border: '2px solid rgba(0,0,0,0.7)',
        borderRadius: 10,
        boxShadow:
          'inset 0 0 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.6)',
        position: 'relative',
      }}
    >
      <div className="rp-neon-sign rp-neon rp-flicker" style={signStyle}>
        {text}
      </div>
      {sub && (
        <div
          className="rp-mono rp-flicker"
          style={{
            color: 'var(--rp-cyan)',
            fontSize: fontSize * 0.28,
            textAlign: 'center',
            marginTop: 4,
            textShadow: '0 0 4px var(--rp-cyan), 0 0 10px rgba(45,212,247,0.67)',
            letterSpacing: '0.2em',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
