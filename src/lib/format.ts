// Tiny formatting helpers used across components.

/** "05" for numeric leaderboard/LED displays. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "003" for big PTS readouts. */
export function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

/** "3 min ago" / "12h ago" — humanize a timestamp for the LIVE label. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'never';
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Ordinal for small integers, e.g. 1 → "1st". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}
