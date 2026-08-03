/**
 * Fixed, full-viewport background layer of slow-moving, angular
 * "cyber sigilism" linework — a chrome/holographic-stroked cousin of
 * NeoTribalLines, present behind every page rather than one section.
 * Pure CSS animation, server-renderable, decorative and inert
 * (pointer-events:none, negative z-index, aria-hidden).
 */
export default function CyberSigilLayer() {
  return (
    <svg className="sigil-layer" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sigilChrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4F3EE" />
          <stop offset="30%" stopColor="#3E8F63" />
          <stop offset="55%" stopColor="#05070B" />
          <stop offset="80%" stopColor="#B7BBC0" />
          <stop offset="100%" stopColor="#F4F3EE" />
        </linearGradient>
      </defs>

      <g className="sigil-group sigil-group-1">
        <path d="M 70 60 L 210 60 L 210 160 L 150 220 L 150 320 M 150 220 L 260 220" />
        <circle cx="70" cy="60" r="5" />
        <circle cx="150" cy="320" r="5" />
      </g>

      <g className="sigil-group sigil-group-2">
        <path d="M 900 120 L 780 120 L 780 260 L 860 340 L 780 420 M 860 340 L 960 340" />
        <path d="M 820 180 L 900 260" />
        <circle cx="900" cy="120" r="5" />
        <circle cx="780" cy="420" r="5" />
      </g>

      <g className="sigil-group sigil-group-3">
        <path d="M 500 470 L 560 530 L 500 590 L 440 530 Z" />
        <path d="M 500 430 L 500 470 M 500 590 L 500 630 M 400 530 L 440 530 M 560 530 L 600 530" />
        <circle cx="500" cy="530" r="4" />
      </g>

      <g className="sigil-group sigil-group-4">
        <path d="M 130 760 L 130 860 L 220 920 L 320 860 L 320 780" />
        <path d="M 130 810 L 220 860 L 320 810" />
        <circle cx="130" cy="760" r="5" />
        <circle cx="320" cy="780" r="5" />
      </g>

      <g className="sigil-group sigil-group-5">
        <path d="M 850 780 L 940 780 L 940 880 M 940 830 L 780 830 L 780 920" />
        <circle cx="850" cy="780" r="5" />
        <circle cx="780" cy="920" r="5" />
      </g>
    </svg>
  );
}
