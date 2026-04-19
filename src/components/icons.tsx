// Small inline SVG icons — trophy, puck, stick.
// Kept inline so they inherit `color` and can be composed freely.

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function TrophyIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      <path d="M6 4h12v4a6 6 0 0 1-12 0V4z" />
      <path d="M6 6H3v2a3 3 0 0 0 3 3" />
      <path d="M18 6h3v2a3 3 0 0 1-3 3" />
      <path d="M10 14h4v4h-4z" />
      <path d="M8 22h8" />
      <path d="M12 18v4" />
    </svg>
  );
}

export function PuckIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="8" rx="9" ry="3" fill={color} stroke="#2b1810" strokeWidth={1.5} />
      <path
        d="M3 8v8a9 3 0 0 0 18 0V8"
        fill="#1a1a1a"
        stroke="#2b1810"
        strokeWidth={1.5}
      />
      <ellipse cx="12" cy="8" rx="9" ry="3" fill="none" stroke={color} strokeWidth={1} />
    </svg>
  );
}

export function StickIcon({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      <path d="M20 3 L10 13 L7 20 L4 17 L7 14 L17 4 Z" fill={color} fillOpacity={0.3} />
    </svg>
  );
}
