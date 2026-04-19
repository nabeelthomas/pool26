// Strip listing tonight's NHL games with each manager's "skin in the game"
// — a quick at-a-glance of which of your players are on the ice.
//
// Reads from /data/schedule.json which the cron writes alongside stats.json.
// File shape: { generatedAt, games: [{ id, away, home, startUTC, status }] }
//
// If schedule.json is missing or empty, the component renders nothing — we
// don't want to ship a "no data" pill to the live site.

import { useEffect, useState } from 'react';
import type { ManagerStanding } from '../types';

interface ScheduleGame {
  id: number;
  away: string; // 3-letter team code
  home: string;
  awayScore: number | null;
  homeScore: number | null;
  period: string | null; // "1st" | "2nd" | "3rd" | "OT" | "SO" | null
  startUTC: string; // ISO
  status?: string; // "live" | "final" | "scheduled"
}

interface ScheduleFile {
  generatedAt: string;
  games: ScheduleGame[];
}

interface TonightSlateProps {
  standings: ManagerStanding[];
}

const SCHEDULE_PATH = `${import.meta.env.BASE_URL}data/schedule.json`.replace(
  /\/+/g,
  '/',
);

export function TonightSlate({ standings }: TonightSlateProps) {
  const [schedule, setSchedule] = useState<ScheduleFile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${SCHEDULE_PATH}?t=${Math.floor(Date.now() / 60_000)}`, {
      cache: 'no-cache',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no schedule'))))
      .then((data: ScheduleFile) => {
        if (cancelled) return;
        setSchedule(data);
      })
      .catch(() => {
        if (cancelled) return;
        setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (missing || !schedule || schedule.games.length === 0) return null;

  // Per-manager skin = count of their players whose team is in any game tonight.
  const managerSkin = new Map<string, number>();
  for (const m of standings) managerSkin.set(m.id, 0);
  const teamsInPlay = new Set<string>();
  for (const g of schedule.games) {
    teamsInPlay.add(g.away);
    teamsInPlay.add(g.home);
  }
  for (const m of standings) {
    let count = 0;
    for (const p of m.roster) if (teamsInPlay.has(p.team)) count++;
    managerSkin.set(m.id, count);
  }

  return (
    <section
      style={{
        background: 'rgba(0,0,0,0.55)',
        border: '3px double var(--rp-lime)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
        padding: '12px 14px',
        color: 'var(--rp-paper)',
        fontFamily: 'DM Mono, monospace',
      }}
      aria-label="Tonight's NHL games"
    >
      <div
        className="rp-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.25em',
          color: 'var(--rp-lime)',
          textTransform: 'uppercase',
          marginBottom: 8,
          textShadow: '0 0 4px var(--rp-lime)',
        }}
      >
        ◆ Today's slate ◆
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 10,
        }}
      >
        {schedule.games.map((g) => (
          <GameChip key={g.id} game={g} />
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          fontSize: 11,
        }}
      >
        {standings.map((m) => {
          const skin = managerSkin.get(m.id) ?? 0;
          const isHot = skin >= 3;
          return (
            <span
              key={m.id}
              style={{
                padding: '3px 8px',
                background: isHot ? 'rgba(198,255,61,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isHot ? 'var(--rp-lime)' : 'rgba(255,255,255,0.15)'}`,
                color: isHot ? 'var(--rp-lime)' : 'var(--rp-paper)',
                letterSpacing: '0.05em',
                borderRadius: 2,
              }}
            >
              {m.displayName}: <b>{skin}</b> in play
            </span>
          );
        })}
      </div>
    </section>
  );
}

function GameChip({ game }: { game: ScheduleGame }) {
  const start = new Date(game.startUTC);
  const time = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const hasScore =
    (isLive || isFinal) &&
    game.awayScore !== null &&
    game.homeScore !== null;

  // Status label: "● LIVE · 2nd" / "FINAL · OT" / "FINAL" / "7:30 ET"
  let statusLabel: string;
  if (isLive) {
    statusLabel = game.period ? `● LIVE · ${game.period}` : '● LIVE';
  } else if (isFinal) {
    statusLabel = game.period ? `FINAL · ${game.period}` : 'FINAL';
  } else {
    statusLabel = `${time} ET`;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: isLive ? 'rgba(255,60,60,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isLive ? 'rgba(255,60,60,0.35)' : 'rgba(255,255,255,0.15)'}`,
        padding: '4px 8px',
        fontSize: 12,
        letterSpacing: '0.05em',
      }}
    >
      {/* Matchup + optional score */}
      <b style={{ color: 'var(--rp-paper)', fontFamily: 'VT323, monospace', fontSize: 16 }}>
        {hasScore
          ? `${game.away} ${game.awayScore} – ${game.homeScore} ${game.home}`
          : `${game.away} @ ${game.home}`}
      </b>
      <span
        style={{
          fontSize: 10,
          color: isLive
            ? 'var(--rp-red-neon)'
            : isFinal
              ? 'var(--rp-muted)'
              : 'var(--rp-cyan)',
          textShadow: isLive ? '0 0 4px var(--rp-red-neon)' : 'none',
          letterSpacing: '0.1em',
        }}
      >
        {statusLabel}
      </span>
    </span>
  );
}
