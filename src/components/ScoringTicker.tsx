// Infinite right→left scrolling ticker. Shows recent scoring events and
// interleaves a joke ("CAWWW") every 2 events. Duplicates its contents so
// the CSS loop hands off seamlessly at -50% translation.

import { useMemo } from 'react';
import type { TickerEvent } from '../types';

interface ScoringTickerProps {
  events: TickerEvent[];
  jokes: string[];
}

interface JokeItem {
  type: 'CAWWW';
  joke: string;
}

type TickerItem = TickerEvent | JokeItem;

const colorForType = (type: TickerItem['type']): string => {
  switch (type) {
    case 'GOAL':
      return 'var(--rp-red-neon)';
    case 'HATTY':
      return 'var(--rp-lime)';
    case 'ASSIST':
      return 'var(--rp-cyan)';
    case 'CAWWW':
      return 'var(--rp-joke)';
    default:
      return 'var(--rp-paper)';
  }
};

/** Interleave: [e, e, joke, e, e, joke, ...]. Safe when events.length is 0. */
function interleave(events: TickerEvent[], jokes: string[]): TickerItem[] {
  if (events.length === 0 && jokes.length === 0) return [];
  if (events.length === 0) {
    // When stats haven't landed yet, show just jokes with a lead-in.
    return jokes.map((joke) => ({ type: 'CAWWW' as const, joke }));
  }
  const out: TickerItem[] = [];
  let jokeIdx = 0;
  for (let i = 0; i < events.length; i++) {
    out.push(events[i]);
    if ((i + 1) % 2 === 0 && jokes.length > 0) {
      out.push({ type: 'CAWWW', joke: jokes[jokeIdx % jokes.length] });
      jokeIdx++;
    }
  }
  return out;
}

export function ScoringTicker({ events, jokes }: ScoringTickerProps) {
  const items = useMemo(() => {
    const shuffled = [...jokes].sort(() => Math.random() - 0.5);
    return interleave(events, shuffled);
  }, [events, jokes]);
  // Duplicate so translateX(-50%) hands off cleanly.
  const doubled = useMemo(() => [...items, ...items], [items]);

  const isEmpty = items.length === 0;

  return (
    <div
      style={{
        background: 'var(--rp-ticker-bg)',
        borderTop: '3px solid var(--rp-wood)',
        borderBottom: '3px solid var(--rp-wood)',
        overflow: 'hidden',
        position: 'relative',
        height: 38,
        display: 'flex',
        alignItems: 'center',
      }}
      aria-label="Live scoring ticker"
    >
      {/* Orange LIVE chip pinned to the left */}
      <div
        className="rp-broadcast"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 120,
          background: 'var(--rp-orange)',
          borderRight: '3px solid var(--rp-wood)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--rp-wood)',
        }}
      >
        <span
          style={{ fontSize: 14, letterSpacing: '0.15em', fontStyle: 'italic' }}
        >
          ◆ LIVE ◆
        </span>
      </div>

      {isEmpty ? (
        <div
          className="rp-mono"
          style={{
            paddingLeft: 136,
            color: 'var(--rp-muted)',
            fontSize: 13,
            fontStyle: 'italic',
          }}
        >
          Stats will start rolling in once the playoffs drop the puck.
        </div>
      ) : (
        <div
          className="rp-mono rp-ticker-track"
          style={{
            display: 'flex',
            gap: 32,
            paddingLeft: 130,
            whiteSpace: 'nowrap',
            animation: 'rp-ticker 102s linear infinite',
            width: 'max-content',
          }}
        >
          {doubled.map((item, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--rp-paper)',
              }}
            >
              <span
                style={{
                  background: colorForType(item.type),
                  color: 'var(--rp-ticker-bg)',
                  padding: '2px 8px',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  border: '1px solid var(--rp-paper)',
                }}
              >
                {item.type}
              </span>
              {item.type === 'CAWWW' ? (
                <span style={{ color: 'var(--rp-paper)', fontStyle: 'italic' }}>
                  {item.joke}
                </span>
              ) : (
                <>
                  <b style={{ color: 'var(--rp-lime)' }}>{item.player}</b>
                  <span style={{ color: 'var(--rp-muted)' }}>{item.team}</span>
                  <span style={{ color: 'var(--rp-paper)' }}>· {item.pool}</span>
                  <span style={{ color: 'var(--rp-muted)' }}>· {item.time}</span>
                </>
              )}
              <span style={{ color: 'var(--rp-orange)' }}>◆</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
