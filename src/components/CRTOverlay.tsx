// Scanlines + vignette + chromatic fringe — the "it's playing on an old
// TV" overlay. Positioned absolutely inside any parent; pointerEvents off
// so it never eats clicks.

import { SCANLINES_CSS } from '../lib/textures';

interface CRTOverlayProps {
  /** Controls scanline darkness and whether the scroll animation runs. */
  intensity?: 'light' | 'medium' | 'heavy';
}

export function CRTOverlay({ intensity = 'medium' }: CRTOverlayProps) {
  const scanOpacity =
    intensity === 'heavy' ? 0.35 : intensity === 'medium' ? 0.22 : 0.12;
  return (
    <>
      {/* Scanlines */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: SCANLINES_CSS,
          opacity: scanOpacity,
          mixBlendMode: 'multiply',
          zIndex: 50,
          animation:
            intensity === 'heavy' ? 'rp-scan-roll 2.4s linear infinite' : 'none',
        }}
      />
      {/* Corner vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          zIndex: 51,
        }}
      />
      {/* Subtle RGB fringe */}
      {intensity === 'heavy' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'repeating-linear-gradient(to right, rgba(255,0,0,0.03) 0, rgba(255,0,0,0.03) 1px, transparent 1px, transparent 2px, rgba(0,0,255,0.03) 2px, rgba(0,0,255,0.03) 3px, transparent 3px, transparent 4px)',
            mixBlendMode: 'screen',
            zIndex: 52,
          }}
        />
      )}
    </>
  );
}
