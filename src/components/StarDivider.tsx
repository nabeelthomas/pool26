// Thin double-bar divider with a star + diamond in the middle.
// Sits between leaderboard header and its sort row.

interface StarDividerProps {
  color?: string;
}

export function StarDivider({ color = 'var(--rp-orange)' }: StarDividerProps) {
  const bar = {
    flex: 1,
    height: 4,
    borderTop: `2px solid ${color}`,
    borderBottom: `2px solid ${color}`,
  } as const;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color,
        width: '100%',
        padding: '6px 0',
      }}
      aria-hidden
    >
      <div style={bar} />
      <span style={{ fontSize: 16 }}>★</span>
      <span className="rp-diamond" />
      <span style={{ fontSize: 16 }}>★</span>
      <div style={bar} />
    </div>
  );
}
