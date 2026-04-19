// Diner-booth style stripe — n colored bands, chunky wood border.
// Used inside the leaderboard header.

interface StripeTrimProps {
  colors?: string[];
  height?: number;
}

export function StripeTrim({
  colors = ['var(--rp-orange)', 'var(--rp-paper)', 'var(--rp-olive)'],
  height = 8,
}: StripeTrimProps) {
  return (
    <div
      style={{
        display: 'flex',
        height,
        width: '100%',
        border: '2px solid var(--rp-wood)',
      }}
      aria-hidden
    >
      {colors.map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}
