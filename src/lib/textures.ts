// Procedural SVG textures — inlined as data URLs so we ship zero binary
// assets. Ported from the handoff prototype's `textures.jsx` + `basement.jsx`.
// All files tuned for the rec-room 90s basement look.

const toDataUrl = (svg: string): string =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

// ─── Wood tongue-and-groove paneling (wall) ──────────────────────────────
const WOOD_GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='500' viewBox='0 0 600 500'>
  <defs>
    <filter id='grain'>
      <feTurbulence type='fractalNoise' baseFrequency='0.018 1.2' numOctaves='4' seed='11'/>
      <feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.04  0 0 0 1.1 -0.08'/>
    </filter>
    <filter id='streaks'>
      <feTurbulence type='fractalNoise' baseFrequency='0.004 0.5' numOctaves='3' seed='4'/>
      <feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0 0.08  0 0 0 0.7 -0.1'/>
    </filter>
    <filter id='dust'>
      <feTurbulence type='fractalNoise' baseFrequency='2.2' numOctaves='1' seed='2'/>
      <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/>
    </filter>
    <radialGradient id='knot1' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0%' stop-color='#1a0a03'/>
      <stop offset='40%' stop-color='#2b1609'/>
      <stop offset='100%' stop-color='#4a2a10' stop-opacity='0'/>
    </radialGradient>
    <radialGradient id='knot2' cx='0.5' cy='0.5' r='0.5'>
      <stop offset='0%' stop-color='#1a0a03'/>
      <stop offset='50%' stop-color='#3a1f0a' stop-opacity='0.7'/>
      <stop offset='100%' stop-color='#4a2a10' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='100%' height='100%' fill='#5a3818'/>
  <rect width='100%' height='100%' filter='url(#streaks)'/>
  <rect width='100%' height='100%' filter='url(#grain)' opacity='0.9'/>
  <g>
    <line x1='75' y1='0' x2='75' y2='500' stroke='#1a0a03' stroke-width='2' opacity='0.9'/>
    <line x1='76' y1='0' x2='76' y2='500' stroke='#8b5a2b' stroke-width='1' opacity='0.3'/>
    <line x1='150' y1='0' x2='150' y2='500' stroke='#1a0a03' stroke-width='2' opacity='0.9'/>
    <line x1='151' y1='0' x2='151' y2='500' stroke='#8b5a2b' stroke-width='1' opacity='0.3'/>
    <line x1='225' y1='0' x2='225' y2='500' stroke='#1a0a03' stroke-width='2' opacity='0.9'/>
    <line x1='226' y1='0' x2='226' y2='500' stroke='#8b5a2b' stroke-width='1' opacity='0.3'/>
    <line x1='300' y1='0' x2='300' y2='500' stroke='#1a0a03' stroke-width='2' opacity='0.9'/>
    <line x1='301' y1='0' x2='301' y2='500' stroke='#8b5a2b' stroke-width='1' opacity='0.3'/>
    <line x1='375' y1='0' x2='375' y2='500' stroke='#1a0a03' stroke-width='2' opacity='0.9'/>
    <line x1='376' y1='0' x2='376' y2='500' stroke='#8b5a2b' stroke-width='1' opacity='0.3'/>
    <line x1='450' y1='0' x2='450' y2='500' stroke='#1a0a03' stroke-width='2' opacity='0.9'/>
    <line x1='451' y1='0' x2='451' y2='500' stroke='#8b5a2b' stroke-width='1' opacity='0.3'/>
    <line x1='525' y1='0' x2='525' y2='500' stroke='#1a0a03' stroke-width='2' opacity='0.9'/>
    <line x1='526' y1='0' x2='526' y2='500' stroke='#8b5a2b' stroke-width='1' opacity='0.3'/>
  </g>
  <ellipse cx='38' cy='120' rx='9' ry='12' fill='url(#knot1)'/>
  <ellipse cx='188' cy='280' rx='11' ry='14' fill='url(#knot1)'/>
  <ellipse cx='340' cy='60' rx='8' ry='10' fill='url(#knot2)'/>
  <ellipse cx='490' cy='380' rx='10' ry='13' fill='url(#knot1)'/>
  <ellipse cx='112' cy='420' rx='7' ry='9' fill='url(#knot2)'/>
  <ellipse cx='265' cy='180' rx='6' ry='8' fill='url(#knot2)'/>
  <ellipse cx='560' cy='230' rx='9' ry='11' fill='url(#knot1)'/>
  <rect width='100%' height='100%' filter='url(#dust)' opacity='0.4'/>
</svg>`;
export const WOOD_GRAIN_URL = toDataUrl(WOOD_GRAIN_SVG);

// ─── Persian rug (floor) ─────────────────────────────────────────────────
const RUG_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'>
  <defs>
    <filter id='wear'>
      <feTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' seed='8'/>
      <feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 0.35 0'/>
    </filter>
    <pattern id='diamonds' x='0' y='0' width='80' height='80' patternUnits='userSpaceOnUse'>
      <rect width='80' height='80' fill='#6e1a1a'/>
      <polygon points='40,10 70,40 40,70 10,40' fill='#c9a24a' stroke='#1a0a03' stroke-width='1.5'/>
      <polygon points='40,22 58,40 40,58 22,40' fill='#1f3a6e'/>
      <circle cx='40' cy='40' r='4' fill='#c9a24a'/>
    </pattern>
    <pattern id='border' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'>
      <rect width='40' height='40' fill='#0e2340'/>
      <polygon points='20,4 36,20 20,36 4,20' fill='#c9a24a' stroke='#1a0a03' stroke-width='0.8'/>
    </pattern>
  </defs>
  <g fill='#d9c79c'>
    <rect y='0' width='800' height='8'/>
    <rect y='492' width='800' height='8'/>
  </g>
  <rect x='0' y='8' width='800' height='484' fill='#5a1515'/>
  <rect x='20' y='28' width='760' height='444' fill='#c9a24a' stroke='#1a0a03' stroke-width='1'/>
  <rect x='32' y='40' width='736' height='420' fill='url(#border)'/>
  <rect x='72' y='80' width='656' height='340' fill='#c9a24a' stroke='#1a0a03' stroke-width='1'/>
  <rect x='80' y='88' width='640' height='324' fill='url(#diamonds)'/>
  <ellipse cx='400' cy='250' rx='120' ry='70' fill='#0e2340' stroke='#c9a24a' stroke-width='3'/>
  <polygon points='400,200 440,250 400,300 360,250' fill='#c9a24a'/>
  <polygon points='400,215 425,250 400,285 375,250' fill='#6e1a1a'/>
  <circle cx='400' cy='250' r='6' fill='#c9a24a'/>
  <g fill='#c9a24a' opacity='0.8'>
    <polygon points='110,110 150,110 130,140'/>
    <polygon points='690,110 650,110 670,140'/>
    <polygon points='110,390 150,390 130,360'/>
    <polygon points='690,390 650,390 670,360'/>
  </g>
  <rect width='100%' height='100%' filter='url(#wear)' opacity='0.85'/>
  <ellipse cx='400' cy='250' rx='220' ry='100' fill='#3d1010' opacity='0.35'/>
  <ellipse cx='180' cy='360' rx='40' ry='24' fill='#2a0808' opacity='0.4'/>
</svg>`;
export const RUG_URL = toDataUrl(RUG_SVG);

// ─── Aged cream paper (roster panel, leaderboard body) ───────────────────
const PAPER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
  <defs>
    <filter id='p'>
      <feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' seed='5'/>
      <feColorMatrix values='0 0 0 0 0.8  0 0 0 0 0.7  0 0 0 0 0.55  0 0 0 0.12 0'/>
    </filter>
    <filter id='p2'>
      <feTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='2' seed='1'/>
      <feColorMatrix values='0 0 0 0 0.6  0 0 0 0 0.45  0 0 0 0 0.25  0 0 0 0.18 -0.05'/>
    </filter>
  </defs>
  <rect width='100%' height='100%' fill='#ebddb8'/>
  <rect width='100%' height='100%' filter='url(#p2)'/>
  <rect width='100%' height='100%' filter='url(#p)'/>
</svg>`;
export const PAPER_URL = toDataUrl(PAPER_SVG);

// ─── CRT scanlines overlay (pure CSS gradient — cheapest) ────────────────
export const SCANLINES_CSS = `repeating-linear-gradient(
  to bottom,
  rgba(0,0,0,0.18) 0px,
  rgba(0,0,0,0.18) 1px,
  transparent 1px,
  transparent 3px
)`;
