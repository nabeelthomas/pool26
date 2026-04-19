// Top-level shell for Pool '26.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PoolData } from '../lib/dataFetch';
import { loadPoolData } from '../lib/dataFetch';
import {
  buildOwnershipMap,
  computeStandings,
  snapshotFromStandings,
  sortStandings,
} from '../lib/standings';
import type { SortKey, StandingsSnapshot } from '../lib/standings';
import { BasementBackground } from './BasementBackground';
import { Leaderboard } from './Leaderboard';
import { NeonSign } from './NeonSign';
import { RosterPanel } from './RosterPanel';
import { ScoringTicker } from './ScoringTicker';
import { ShareCard } from './ShareCard';
import { TonightSlate } from './TonightSlate';

const SELECTION_KEY = 'pool26.selectedManagerId';
const SNAPSHOT_KEY = 'pool26.lastSnapshot';
const REFRESH_MS = 5 * 60 * 1000; // 5-minute background poll while tab is open
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

function loadStoredSnapshot(): StandingsSnapshot | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StandingsSnapshot;
  } catch {
    return null;
  }
}

export function App() {
  const [data, setData] = useState<PoolData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('points');
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SELECTION_KEY);
  });
  const [shareOpen, setShareOpen] = useState(false);
  const isMobile = useIsMobile();

  // Snapshot of standings as the user last saw them — used to compute the
  // "+N since you looked" badge. We capture this ONCE at first paint of a
  // session, then update it when the user closes/reopens the tab.
  const visitSnapshotRef = useRef<StandingsSnapshot | null>(loadStoredSnapshot());

  // Reusable loader so we can call it on mount and from the polling loop.
  const refresh = useRef<() => Promise<void>>(async () => {});
  refresh.current = async () => {
    try {
      const pool = await loadPoolData();
      setData(pool);
      setLoadError(null);
    } catch (err) {
      setLoadError((err as Error).message);
    }
  };

  // Initial load.
  useEffect(() => {
    refresh.current();
  }, []);

  // Background polling: every 5 min, plus an extra refresh whenever the
  // tab regains focus (so phones unlocked from sleep get fresh numbers).
  useEffect(() => {
    const interval = window.setInterval(() => refresh.current(), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Persist manager selection.
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

  const ownership = useMemo(() => {
    if (!data) return {};
    return buildOwnershipMap(data.rosters);
  }, [data]);

  const selectedManager = useMemo(() => {
    if (standings.length === 0) return null;
    if (selectedId) {
      const match = standings.find((s) => s.id === selectedId);
      if (match) return match;
    }
    return standings[0];
  }, [standings, selectedId]);

  // Compute "points since last visit" once we have standings AND a stored
  // snapshot. Bail when the snapshot is older than 12h (otherwise the
  // delta swallows entire rounds and stops being interesting).
  const pointsSinceLastVisit = useMemo(() => {
    if (standings.length === 0) return undefined;
    const snap = visitSnapshotRef.current;
    if (!snap) return undefined;
    const ageMs = Date.now() - new Date(snap.takenAt).getTime();
    if (ageMs > 12 * 60 * 60 * 1000) return undefined;
    const out: Record<string, number> = {};
    for (const s of standings) {
      const prior = snap.totalsById[s.id]?.points ?? s.totals.points;
      out[s.id] = Math.max(0, s.totals.points - prior);
    }
    return out;
  }, [standings]);

  // Persist a fresh snapshot whenever standings change, so next visit has
  // an accurate baseline.
  useEffect(() => {
    if (standings.length === 0) return;
    if (typeof window === 'undefined') return;
    const fresh = snapshotFromStandings(standings);
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(fresh));
  }, [standings]);

  if (loadError && !data) {
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
  const totalManagers = data.rosters.managers.length;

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
        {/* Thin header band */}
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
            sub={
              isMobile
                ? `RD · ${roundLabel.toUpperCase()}`
                : 'PLAYOFF PICKS · EST. 1215'
            }
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
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="rp-mono"
            style={{
              padding: '6px 12px',
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              background: 'var(--rp-amber)',
              color: 'var(--rp-wood-dark)',
              border: '2px solid var(--rp-wood-dark)',
              cursor: 'pointer',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.7)',
              fontWeight: 700,
            }}
            aria-label="Open shareable standings card"
          >
            ◆ Share
          </button>
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
            padding: isMobile ? '12px 12px 16px' : '24px 32px 16px',
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
              pointsSinceLastVisit={pointsSinceLastVisit}
            />
          </div>
          <div style={{ minWidth: 0, opacity: 0.92 }}>
            <RosterPanel
              manager={selectedManager}
              teams={data.rosters.teams}
              ownership={ownership}
              totalManagers={totalManagers}
              onClose={isMobile ? () => setSelectedId(null) : undefined}
            />
          </div>
        </main>

        {/* Tonight's slate — full width below the main grid */}
        <div
          style={{
            padding: isMobile ? '0 12px 16px' : '0 32px 16px',
          }}
        >
          <TonightSlate standings={standings} />
        </div>

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
          ◆ {totalManagers} managers · 15 skaters each · G=1 A=1 · auto-refresh ◆
        </footer>
      </div>

      {shareOpen && (
        <ShareCard
          standings={standings}
          roundLabel={roundLabel}
          lastUpdated={data.stats.lastUpdated}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
