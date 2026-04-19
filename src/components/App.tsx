// Top-level shell for Pool '26.
//
// Responsibilities:
//   1. Load the three static JSON files once on mount (rosters/stats/events/jokes)
//   2. Hold selection + sort state (selection persists to localStorage)
//   3. Compute standings and sort
//   4. Render: BasementBackground, header (neon), ticker, and the
//      responsive two-pane layout (Leaderboard left, RosterPanel right).
//
// Responsive breakpoint is a simple 900px JS check — we only need one
// switch and CSS media queries don't compose well with the inline styles
// we use everywhere else.

import { useEffect, useMemo, useState } from 'react';
import type { PoolData } from '../lib/dataFetch';
import { loadPoolData } from '../lib/dataFetch';
import { computeStandings, sortStandings } from '../lib/standings';
import type { SortKey } from '../lib/standings';
import { BasementBackground } from './BasementBackground';
import { Leaderboard } from './Leaderboard';
import { NeonSign } from './NeonSign';
import { RosterPanel } from './RosterPanel';
import { ScoringTicker } from './ScoringTicker';
import { StarDivider } from './StarDivider';

const SELECTION_KEY = 'pool26.selectedManagerId';
const MOBILE_BREAKPOINT = 900;

function useIsMobile(): boolean {
  const getter = () =>
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
  const [isMobile, setIsMobile] = useState<boolean>(getter);
  useEffect(() => {
    const handler = () => setIsMobile(getter());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export function App() {
  const [data, setData] = useState<PoolData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('points');
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SELECTION_KEY);
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;
    loadPoolData()
      .then((pool) => {
        if (cancelled) return;
        setData(pool);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist manager selection so reopening the page lands on your guy.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedId) {
      window.localStorage.setItem(SELECTION_KEY, selectedId);
    } else {
      window.localStorage.removeItem(SELECTION_KEY);
    }
  }, [selectedId]);

  const standings = useMemo(() => {
    if (!data) return [];
    return sortStandings(computeStandings(data.rosters, data.stats), sortKey);
  }, [data, sortKey]);

  const selectedManager = useMemo(() => {
    if (standings.length === 0) return null;
    if (selectedId) {
      const match = standings.find((s) => s.id === selectedId);
      if (match) return match;
    }
    // Fall back to the leader so the roster panel isn't empty on first load.
    return standings[0];
  }, [standings, selectedId]);

  if (loadError) {
    return (
      <>
        <BasementBackground />
        <div
          style={{
            maxWidth: 560,
            margin: '80px auto',
            padding: 24,
            background: 'var(--rp-paper)',
            border: '4px double var(--rp-wood)',
            fontFamily: 'DM Mono, monospace',
            color: 'var(--rp-wood)',
            textAlign: 'center',
          }}
        >
          <h1
            className="rp-display"
            style={{ fontSize: 28, margin: 0, marginBottom: 12 }}
          >
            Pool '26 · Signal Lost
          </h1>
          <p style={{ marginBottom: 8 }}>
            Couldn't load the pool data.
          </p>
          <code
            style={{
              display: 'block',
              background: 'rgba(0,0,0,0.08)',
              padding: 8,
              fontSize: 12,
              wordBreak: 'break-all',
            }}
          >
            {loadError}
          </code>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <BasementBackground />
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'VT323, monospace',
            fontSize: 28,
            color: 'var(--rp-lime)',
            textShadow: '0 0 6px var(--rp-lime)',
            letterSpacing: '0.15em',
          }}
          role="status"
          aria-live="polite"
        >
          ◆ TUNING IN ◆
        </div>
      </>
    );
  }

  const roundLabel = data.rosters.round ?? 'Playoffs';

  return (
    <>
      <BasementBackground />

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '16px 12px 40px' : '28px 28px 64px',
          gap: isMobile ? 16 : 20,
          maxWidth: 1400,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Header — neon sign + round label */}
        <header
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          <div>
            <NeonSign
              text="Pool '26"
              sub="NHL PLAYOFF LEADERBOARD"
              size={isMobile ? 'md' : 'lg'}
              color="var(--rp-red-neon)"
            />
          </div>
          <div
            className="rp-mono"
            style={{
              color: 'var(--rp-paper)',
              fontSize: 13,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textShadow: '1px 1px 0 rgba(0,0,0,0.7)',
              opacity: 0.85,
            }}
          >
            ◆ {data.rosters.season} · {roundLabel} ◆
          </div>
        </header>

        <StarDivider />

        {/* Ticker */}
        <ScoringTicker events={data.events.events} jokes={data.jokes} />

        {/* Main two-pane area */}
        <main
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
            gap: isMobile ? 20 : 28,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              minWidth: 0,
            }}
          >
            <Leaderboard
              standings={standings}
              selectedId={selectedManager?.id ?? null}
              onSelect={(id) => setSelectedId(id)}
              sortKey={sortKey}
              setSortKey={setSortKey}
              lastUpdated={data.stats.lastUpdated}
              roundLabel={roundLabel}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <RosterPanel
              manager={selectedManager}
              teams={data.rosters.teams}
              onClose={isMobile ? () => setSelectedId(null) : undefined}
            />
          </div>
        </main>

        {/* Footer — tiny credits strip */}
        <footer
          className="rp-mono"
          style={{
            textAlign: 'center',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--rp-paper)',
            opacity: 0.6,
            marginTop: 12,
          }}
        >
          ◆ {data.rosters.managers.length} managers · 15 skaters each · G=1
          A=1 · data refreshes ~5× daily ◆
        </footer>
      </div>
    </>
  );
}
