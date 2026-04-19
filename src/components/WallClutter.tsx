// Maximalist collage of pennants, records, darts, signs and jerseys that
// peek in around the main UI. Ported from the prototype's `wall-clutter.jsx`
// verbatim (just re-packaged as a React SVG so we keep accessibility
// out of the way with aria-hidden).
//
// 1280×900 viewBox; `preserveAspectRatio="xMidYMid slice"` means it
// covers whatever container it lives in and crops the edges, which suits
// a background layer.

export function WallClutter() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280 900"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="skate1" x1="0" x2="1">
          <stop offset="0" stopColor="#ff7a00" />
          <stop offset="1" stopColor="#ffb84d" />
        </linearGradient>
        <linearGradient id="skate2" x1="0" x2="1">
          <stop offset="0" stopColor="#2dd4f7" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
        <radialGradient id="record" cx="0.5" cy="0.5">
          <stop offset="0" stopColor="#111" />
          <stop offset="0.6" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#0a0a0a" />
        </radialGradient>
        <radialGradient id="dartboard">
          <stop offset="0" stopColor="#c9a24a" />
          <stop offset="0.4" stopColor="#c9a24a" />
          <stop offset="0.4001" stopColor="#6e1a1a" />
          <stop offset="0.7" stopColor="#6e1a1a" />
          <stop offset="0.7001" stopColor="#0e2340" />
          <stop offset="1" stopColor="#0e2340" />
        </radialGradient>
      </defs>

      {/* ROW 1 — pennants, clock, license plate, neon, record */}
      <g transform="translate(40,30) rotate(-6)">
        <path d="M0,0 L140,0 L110,24 L140,48 L0,48 Z" fill="#c45a2b" stroke="#1a0a03" strokeWidth="2" />
        <text x="14" y="32" fontFamily="Alfa Slab One, Georgia, serif" fontSize="18" fill="#ebddb8">
          LEAFS
        </text>
      </g>
      <g transform="translate(210,22) rotate(3)">
        <path d="M0,0 L140,0 L110,24 L140,48 L0,48 Z" fill="#0e2340" stroke="#1a0a03" strokeWidth="2" />
        <text x="14" y="32" fontFamily="Alfa Slab One, Georgia, serif" fontSize="18" fill="#c9a24a">
          FLAMES
        </text>
      </g>
      <g transform="translate(430,30)">
        <circle cx="40" cy="40" r="38" fill="#ebddb8" stroke="#1a0a03" strokeWidth="3" />
        <circle cx="40" cy="40" r="34" fill="none" stroke="#5a4a2a" strokeWidth="1" />
        <text x="38" y="18" fontFamily="Georgia" fontSize="8" fill="#2b1810" textAnchor="middle">12</text>
        <text x="62" y="44" fontFamily="Georgia" fontSize="8" fill="#2b1810" textAnchor="middle">3</text>
        <text x="38" y="70" fontFamily="Georgia" fontSize="8" fill="#2b1810" textAnchor="middle">6</text>
        <text x="14" y="44" fontFamily="Georgia" fontSize="8" fill="#2b1810" textAnchor="middle">9</text>
        <line x1="40" y1="40" x2="40" y2="16" stroke="#2b1810" strokeWidth="2" />
        <line x1="40" y1="40" x2="58" y2="40" stroke="#2b1810" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="3" fill="#c45a2b" />
      </g>
      <g transform="translate(550,36) rotate(4)">
        <rect width="130" height="50" fill="#ebddb8" stroke="#1a0a03" strokeWidth="2" rx="4" />
        <text x="65" y="20" fontFamily="Alfa Slab One, serif" fontSize="10" fill="#6e1a1a" textAnchor="middle">
          ONTARIO
        </text>
        <text x="65" y="40" fontFamily="VT323, monospace" fontSize="22" fill="#0e2340" textAnchor="middle">
          POOL '26
        </text>
      </g>
      <g transform="translate(720,20) rotate(-3)">
        <rect x="-4" y="-4" width="160" height="68" fill="#1a0a03" stroke="#3a3a3a" strokeWidth="2" rx="4" />
        <text x="76" y="30" fontFamily="Monoton, Alfa Slab One, serif" fontSize="24" fill="#ff2e3d" textAnchor="middle" opacity="0.95">
          ICE COLD
        </text>
        <text x="76" y="54" fontFamily="Monoton, serif" fontSize="16" fill="#2dd4f7" textAnchor="middle">
          ◆ BREW ◆
        </text>
      </g>
      <g transform="translate(910,26)">
        <circle cx="36" cy="36" r="34" fill="url(#record)" stroke="#0a0a0a" strokeWidth="1" />
        <circle cx="36" cy="36" r="14" fill="#c45a2b" />
        <circle cx="36" cy="36" r="3" fill="#1a0a03" />
      </g>
      <g transform="translate(1020,22) rotate(-4)">
        <rect width="90" height="64" fill="#3d2010" stroke="#1a0a03" strokeWidth="2" />
        <rect x="4" y="4" width="82" height="56" fill="#5a4a3a" />
        <text x="45" y="34" fontFamily="DM Mono, monospace" fontSize="8" fill="#ebddb8" textAnchor="middle">
          STANLEY CUP
        </text>
        <text x="45" y="46" fontFamily="DM Mono, monospace" fontSize="8" fill="#ebddb8" textAnchor="middle">
          PARADE '93
        </text>
      </g>
      <g transform="translate(1140,40) rotate(8)">
        <path d="M0,0 L110,14 L0,28 Z" fill="#5a6b3a" stroke="#1a0a03" strokeWidth="2" />
        <text x="8" y="20" fontFamily="Alfa Slab One, serif" fontSize="11" fill="#ebddb8">
          ★ NHL ★
        </text>
      </g>

      {/* ROW 2 — skateboards, stick cross, dartboard, tin sign, bike wheel */}
      <g transform="translate(20,140) rotate(-8)">
        <rect width="180" height="40" rx="20" fill="url(#skate1)" stroke="#1a0a03" strokeWidth="2" />
        <circle cx="30" cy="48" r="6" fill="#1a0a03" />
        <circle cx="150" cy="48" r="6" fill="#1a0a03" />
        <text x="90" y="26" fontFamily="Alfa Slab One, serif" fontSize="13" fill="#1a0a03" textAnchor="middle">
          VANS '92
        </text>
      </g>
      <g transform="translate(230,130)">
        <g transform="rotate(-30)">
          <rect x="0" y="0" width="220" height="10" fill="#c9a24a" stroke="#1a0a03" strokeWidth="1.5" />
          <path d="M0,0 L-28,14 L-28,4 L0,-4 Z" fill="#6e3a1c" stroke="#1a0a03" strokeWidth="1.5" />
        </g>
        <g transform="rotate(30)">
          <rect x="0" y="0" width="220" height="10" fill="#c9a24a" stroke="#1a0a03" strokeWidth="1.5" />
          <path d="M0,0 L-28,14 L-28,4 L0,-4 Z" fill="#6e3a1c" stroke="#1a0a03" strokeWidth="1.5" />
        </g>
        <circle cx="0" cy="0" r="12" fill="#1a0a03" stroke="#ebddb8" strokeWidth="1" />
      </g>
      <g transform="translate(540,130)">
        <circle cx="44" cy="44" r="42" fill="url(#dartboard)" stroke="#1a0a03" strokeWidth="3" />
        <circle cx="44" cy="44" r="6" fill="#c6ff3d" />
      </g>
      <g transform="translate(680,140) rotate(6)">
        <rect width="180" height="40" rx="20" fill="url(#skate2)" stroke="#1a0a03" strokeWidth="2" />
        <circle cx="30" cy="48" r="6" fill="#1a0a03" />
        <circle cx="150" cy="48" r="6" fill="#1a0a03" />
        <text x="90" y="26" fontFamily="Alfa Slab One, serif" fontSize="12" fill="#1a0a03" textAnchor="middle">
          ★ RIPPER ★
        </text>
      </g>
      <g transform="translate(900,130) rotate(-3)">
        <rect width="150" height="70" fill="#6e1a1a" stroke="#1a0a03" strokeWidth="2" />
        <rect x="4" y="4" width="142" height="62" fill="none" stroke="#ebddb8" strokeWidth="1.5" />
        <text x="75" y="30" fontFamily="Alfa Slab One, serif" fontSize="18" fill="#ebddb8" textAnchor="middle">
          HOCKEY
        </text>
        <text x="75" y="52" fontFamily="Alfa Slab One, serif" fontSize="14" fill="#c9a24a" textAnchor="middle">
          NIGHT ◆ 8PM
        </text>
      </g>
      <g transform="translate(1090,130)">
        <circle cx="60" cy="60" r="56" fill="none" stroke="#1a0a03" strokeWidth="4" />
        <circle cx="60" cy="60" r="50" fill="none" stroke="#5a4a3a" strokeWidth="2" />
        <g stroke="#8b7a58" strokeWidth="1">
          <line x1="60" y1="8" x2="60" y2="112" />
          <line x1="8" y1="60" x2="112" y2="60" />
          <line x1="24" y1="24" x2="96" y2="96" />
          <line x1="96" y1="24" x2="24" y2="96" />
        </g>
        <circle cx="60" cy="60" r="6" fill="#c45a2b" stroke="#1a0a03" strokeWidth="1.5" />
      </g>

      {/* ROW 3 — gas pump, records, OPEN sign, Route 66, jersey, horseshoe */}
      <g transform="translate(40,290) rotate(4)">
        <rect width="80" height="120" fill="#5a6b3a" stroke="#1a0a03" strokeWidth="2" rx="4" />
        <circle cx="40" cy="30" r="18" fill="#ebddb8" stroke="#1a0a03" strokeWidth="1.5" />
        <text x="40" y="35" fontFamily="Alfa Slab One, serif" fontSize="14" fill="#6e1a1a" textAnchor="middle">
          ESSO
        </text>
        <rect x="14" y="60" width="52" height="40" fill="#ebddb8" stroke="#1a0a03" strokeWidth="1" />
        <text x="40" y="85" fontFamily="VT323, monospace" fontSize="18" fill="#2b1810" textAnchor="middle">
          0.99¢
        </text>
      </g>
      <g transform="translate(150,300)">
        <circle cx="40" cy="40" r="38" fill="url(#record)" stroke="#0a0a0a" strokeWidth="1" />
        <circle cx="40" cy="40" r="16" fill="#c6ff3d" />
        <circle cx="40" cy="40" r="3" fill="#1a0a03" />
      </g>
      <g transform="translate(260,300) rotate(-4)">
        <rect width="130" height="60" fill="#c6ff3d" stroke="#1a0a03" strokeWidth="2" rx="4" />
        <text x="65" y="40" fontFamily="Alfa Slab One, serif" fontSize="28" fill="#1a0a03" textAnchor="middle">
          OPEN
        </text>
      </g>
      <g transform="translate(420,288) rotate(2)">
        <path d="M50,0 L90,20 L100,70 L50,90 L0,70 L10,20 Z" fill="#ebddb8" stroke="#1a0a03" strokeWidth="3" />
        <text x="50" y="38" fontFamily="Alfa Slab One, serif" fontSize="10" fill="#2b1810" textAnchor="middle">
          RTE
        </text>
        <text x="50" y="62" fontFamily="Alfa Slab One, serif" fontSize="22" fill="#2b1810" textAnchor="middle">
          66
        </text>
      </g>
      <g transform="translate(550,310)">
        <circle cx="36" cy="36" r="34" fill="url(#record)" stroke="#0a0a0a" strokeWidth="1" />
        <circle cx="36" cy="36" r="14" fill="#ff2e3d" />
        <circle cx="36" cy="36" r="3" fill="#1a0a03" />
      </g>
      <g transform="translate(660,280) rotate(-5)">
        <path d="M20,0 L60,0 L80,10 L90,40 L90,120 L0,120 L0,40 L10,10 Z" fill="#0e2340" stroke="#1a0a03" strokeWidth="2" />
        <path d="M20,0 L40,20 L60,0" fill="#ebddb8" stroke="#1a0a03" strokeWidth="1.5" />
        <text x="45" y="75" fontFamily="Alfa Slab One, serif" fontSize="36" fill="#ebddb8" textAnchor="middle">
          97
        </text>
        <text x="45" y="105" fontFamily="Alfa Slab One, serif" fontSize="9" fill="#ebddb8" textAnchor="middle">
          CONNOR
        </text>
      </g>
      <g transform="translate(780,300)">
        <path d="M10,0 Q10,70 40,70 Q70,70 70,0 L58,0 Q58,60 40,60 Q22,60 22,0 Z" fill="#8b7a58" stroke="#1a0a03" strokeWidth="2" />
        <circle cx="14" cy="6" r="2.5" fill="#1a0a03" />
        <circle cx="26" cy="6" r="2.5" fill="#1a0a03" />
        <circle cx="54" cy="6" r="2.5" fill="#1a0a03" />
        <circle cx="66" cy="6" r="2.5" fill="#1a0a03" />
      </g>
      <g transform="translate(870,294) rotate(3)">
        <rect width="90" height="90" fill="#1a0a03" stroke="#3d2010" strokeWidth="3" />
        <rect x="8" y="8" width="74" height="74" fill="#c45a2b" />
        <text x="45" y="38" fontFamily="Alfa Slab One, serif" fontSize="11" fill="#ebddb8" textAnchor="middle">
          THE
        </text>
        <text x="45" y="54" fontFamily="Alfa Slab One, serif" fontSize="14" fill="#ebddb8" textAnchor="middle">
          HIP
        </text>
        <text x="45" y="70" fontFamily="DM Mono, monospace" fontSize="7" fill="#ebddb8" textAnchor="middle">
          LP · 1992
        </text>
      </g>
      <g transform="translate(990,300) rotate(-5)">
        <path d="M0,0 L170,16 L0,32 Z" fill="#c45a2b" stroke="#1a0a03" strokeWidth="2" />
        <text x="10" y="22" fontFamily="Alfa Slab One, serif" fontSize="13" fill="#ebddb8">
          OILERS '90
        </text>
      </g>
      <g transform="translate(1170,290)">
        <circle cx="40" cy="40" r="34" fill="#ebddb8" stroke="#1a0a03" strokeWidth="3" />
        <line x1="40" y1="40" x2="40" y2="18" stroke="#2b1810" strokeWidth="2.5" />
        <line x1="40" y1="40" x2="56" y2="46" stroke="#2b1810" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="3" fill="#c45a2b" />
      </g>

      {/* ROW 4 — diner accents */}
      <g transform="translate(60,450) rotate(-2)">
        <rect width="110" height="60" fill="#2dd4f7" stroke="#1a0a03" strokeWidth="2" rx="4" />
        <text x="55" y="26" fontFamily="Alfa Slab One, serif" fontSize="13" fill="#1a0a03" textAnchor="middle">
          DINER
        </text>
        <text x="55" y="46" fontFamily="DM Mono, monospace" fontSize="10" fill="#1a0a03" textAnchor="middle">
          ◆ 24 HRS ◆
        </text>
      </g>
      <g transform="translate(210,460)">
        <circle cx="30" cy="30" r="28" fill="#c6ff3d" stroke="#1a0a03" strokeWidth="2" />
        <text x="30" y="36" fontFamily="Alfa Slab One, serif" fontSize="14" fill="#1a0a03" textAnchor="middle">
          DAD
        </text>
      </g>
      <g transform="translate(1020,450) rotate(3)">
        <rect width="170" height="70" fill="#1a0a03" stroke="#3a3a3a" strokeWidth="2" rx="4" />
        <text x="85" y="36" fontFamily="Monoton, serif" fontSize="22" fill="#ff9f1c" textAnchor="middle">
          DINER
        </text>
        <text x="85" y="58" fontFamily="Monoton, serif" fontSize="14" fill="#2dd4f7" textAnchor="middle">
          ◆ OPEN ◆
        </text>
      </g>
    </svg>
  );
}
