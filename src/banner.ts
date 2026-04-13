/** Inline SVG banner — amber/orange geometric design for FarCred header */
export const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1205"/>
      <stop offset="100%" stop-color="#0c0c10"/>
    </linearGradient>
    <linearGradient id="amber1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFAE00" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FF8C00" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="amber2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFD700" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#FFAE00" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="glow" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#FFAE00" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="#FFAE00" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#FFAE00" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="200" fill="url(#bg)"/>
  <!-- geometric diamond grid -->
  <g opacity="0.4">
    <polygon points="400,10 450,55 400,100 350,55" fill="url(#amber1)" stroke="#FFAE00" stroke-opacity="0.15" stroke-width="0.5"/>
    <polygon points="320,40 370,85 320,130 270,85" fill="url(#amber2)" stroke="#FFAE00" stroke-opacity="0.1" stroke-width="0.5"/>
    <polygon points="480,40 530,85 480,130 430,85" fill="url(#amber2)" stroke="#FFAE00" stroke-opacity="0.1" stroke-width="0.5"/>
    <polygon points="240,20 290,65 240,110 190,65" fill="url(#amber1)" stroke="#FFAE00" stroke-opacity="0.08" stroke-width="0.5"/>
    <polygon points="560,20 610,65 560,110 510,65" fill="url(#amber1)" stroke="#FFAE00" stroke-opacity="0.08" stroke-width="0.5"/>
    <polygon points="160,50 210,95 160,140 110,95" fill="url(#amber2)" stroke="#FFAE00" stroke-opacity="0.05" stroke-width="0.5"/>
    <polygon points="640,50 690,95 640,140 590,95" fill="url(#amber2)" stroke="#FFAE00" stroke-opacity="0.05" stroke-width="0.5"/>
  </g>
  <!-- horizontal accent lines -->
  <line x1="100" y1="100" x2="700" y2="100" stroke="#FFAE00" stroke-opacity="0.06" stroke-width="1"/>
  <line x1="150" y1="130" x2="650" y2="130" stroke="#FFAE00" stroke-opacity="0.04" stroke-width="0.5"/>
  <!-- top glow -->
  <rect x="250" y="0" width="300" height="80" fill="url(#glow)" rx="40"/>
  <!-- corner accents -->
  <circle cx="50" cy="30" r="3" fill="#FFAE00" opacity="0.3"/>
  <circle cx="750" cy="30" r="3" fill="#FFAE00" opacity="0.3"/>
  <circle cx="50" cy="170" r="2" fill="#FFAE00" opacity="0.15"/>
  <circle cx="750" cy="170" r="2" fill="#FFAE00" opacity="0.15"/>
  <!-- subtle dots -->
  <circle cx="200" cy="160" r="1.5" fill="#FFAE00" opacity="0.2"/>
  <circle cx="600" cy="160" r="1.5" fill="#FFAE00" opacity="0.2"/>
  <circle cx="300" cy="170" r="1" fill="#FFAE00" opacity="0.15"/>
  <circle cx="500" cy="170" r="1" fill="#FFAE00" opacity="0.15"/>
</svg>`;
