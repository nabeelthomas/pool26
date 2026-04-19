// Top-level shell for Pool '26.
//
// Layout matches the final design handoff (app.jsx):
//   Desktop: thin header band with small neon left + STANLEY CUP pill +
//            tiny LIVE/NHL.COM neon right. Ticker. Big TV + roster panel
//            (roster sits at opacity 0.7 so the basement reads through).
//   Mobile:  status bar + small centered neon, ticker, then either the
//            leaderboard or the roster (roster wins when one is selected).

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
          <p style={{ marginBottom: 8 }}>Couldn't load the pool data.</p>
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
          maxWidth: 1280,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Thin header band — matches the final design */}
        <header
          style={{
            padding: isMobile ? '10px 12px 8px' : '14px 28px 10px',
            borderBottom: '3px solid #1a0e05',
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.15))',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 18,
            flexWrap: 'wrap',
          }}
        >
          <NeonSign
            text="Pool '26"
            sub={isMobile ? `RD · ${roundLabel.toUpperCase()}` : 'PLAYOFF PICKS · EST. 1215'}
            size={isMobile ? 'sm' : 'md'}
            color="var(--rp-red-neon)"
          />
          <div style={{ flex: 1 }} />
          {!isMobile && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div
                className="rp-mono"
                style={{
                  fontSize: 9,
                  color: 'var(--rp-lime)',
                  letterSpacing: '0.15em',
                  padding: '4px 8px',
                  border: '1px dashed var(--rp-lime)',
                  background: 'rgba(0,0,0,0.5)',
                  textTransform: 'uppercase',
                }}
              >
                ◆ {data.rosters.season} · {roundLabel} ◆
              </div>
              <NeonSign
                text="LIVE"
                sub="NHL.COM"
                color="var(--rp-lime)"
                size="sm"
              />
            </div>
          )}
        </header>

        {/* Ticker */}
        <ScoringTicker events={data.events.events} jokes={data.jokes} />

        {/* Main two-pane area */}
        <main
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            gap: isMobile ? 16 : 24,
            alignItems: 'flex-start',
            padding: isMobile ? '12px 12px 80px' : '24px 32px 80px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: isMobile ? 'center' : 'flex-end',
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
          <div
            style={{
              minWidth: 0,
              // The final design lets the basement read through the roster.
              opacity: 0.92,
            }}
          >
            <RosterPanel
              manager={selectedManager}
              teams={data.rosters.teams}
              onClose={isMobile ? () => setSelectedId(null) : undefined}
            />
          </div>
        </main>

        <footer
          className="rp-mono"
          style={{
            textAlign: 'center',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--rp-paper)',
            opacity: 0.6,
            padding: '0 12px 16px',
          }}
        >
          ◆ {data.rosters.managers.length} managers · 15 skaters each · G=1
          A=1 · auto-refresh ◆
        </footer>
      </div>
    </>
  );
}
