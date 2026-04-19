// Full-viewport basement backdrop — wood wall, dado rail, dark floor, and
// a Persian-style rug. All procedural SVG (zero binary assets). The
// WallClutter overlay sits on top and is fixed-ratio so it parallaxes
// gently on wide screens.

import { WOOD_GRAIN_URL, RUG_URL } from '../lib/textures';
import { WallClutter } from './WallClutter';

export function BasementBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: '#2a1608',
      }}
    >
      {/* Wood wall — top 62% */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '62%',
          backgroundImage: WOOD_GRAIN_URL,
          backgroundColor: '#5a3818',
          backgroundSize: '600px 500px',
        }}
      />
      {/* Ceiling shadow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
        }}
      />
      {/* Dado rail */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 'calc(62% - 14px)',
          height: 14,
          background:
            'linear-gradient(to bottom, #8b5a2b 0%, #6e3a1c 40%, #3d2010 100%)',
          borderTop: '2px solid #2a1608',
          borderBottom: '2px solid #1a0a03',
          boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
        }}
      />
      {/* Floor (concrete peeking around the rug) */}
      <div
        style={{
          position: 'absolute',
          top: '62%',
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(ellipse at center 30%, #2a1a0c 0%, #1a0e05 80%)',
        }}
      />
      {/* Rug — perspective-skewed to look like it lies on the floor */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(62% - 20px)',
          left: '-4%',
          right: '-4%',
          height: '42%',
          backgroundImage: RUG_URL,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          transform: 'perspective(900px) rotateX(22deg)',
          transformOrigin: 'center top',
          boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
        }}
      />
      {/* Floor shadow under wall */}
      <div
        style={{
          position: 'absolute',
          top: '62%',
          left: 0,
          right: 0,
          height: 40,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
        }}
      />
      {/* Baseboard */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 10,
          background: 'linear-gradient(to bottom, #4a2a15 0%, #2a1608 100%)',
          borderTop: '2px solid #1a0a03',
        }}
      />
      {/* Wall clutter — faint, set behind the main content with a readability mask */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '62%',
          opacity: 0.35,
          mixBlendMode: 'multiply',
        }}
      >
        <WallClutter />
      </div>
    </div>
  );
}
