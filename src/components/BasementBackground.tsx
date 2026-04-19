// Full-viewport basement backdrop.
//
// Two modes:
//   1. PHOTO: if /assets/basement-bg.{png,jpg,webp} exists in public/assets/,
//      it's used as the dominant background (this is what the final design
//      handoff calls for).
//   2. PROCEDURAL FALLBACK: drawn-in-CSS wood wall + dado rail + rug +
//      WallClutter overlay. Identical to the prototype's earlier
//      basement.jsx so the site looks finished even without the photo.
//
// The vignette + edge shadow layers sit on top of either mode so chrome
// (TV, roster panel) reads cleanly against the background.

import { useEffect, useState } from 'react';
import { WOOD_GRAIN_URL, RUG_URL } from '../lib/textures';
import { WallClutter } from './WallClutter';

const PHOTO_PATH = `${import.meta.env.BASE_URL}assets/basement-bg.png`.replace(
  /\/+/g,
  '/',
);

/** Probe whether the optional photo exists. Returns null until resolved. */
function usePhotoAvailable(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setOk(true);
    img.onerror = () => !cancelled && setOk(false);
    img.src = PHOTO_PATH;
    return () => {
      cancelled = true;
    };
  }, []);
  return ok;
}

export function BasementBackground() {
  const photoOk = usePhotoAvailable();

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
      {photoOk ? (
        <PhotoLayer />
      ) : photoOk === false ? (
        <ProceduralLayer />
      ) : null /* still probing — keep it dark */}

      {/* Edge shadows + vignette — sit on top of either mode */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center 35%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 100,
          pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 80,
          pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
        }}
      />
    </div>
  );
}

function PhotoLayer() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("${PHOTO_PATH}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#2a1608',
      }}
    />
  );
}

function ProceduralLayer() {
  return (
    <>
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
      {/* Floor */}
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
      {/* Rug */}
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
      {/* Wall clutter — faint, behind the main content */}
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
    </>
  );
}
