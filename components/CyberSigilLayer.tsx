'use client';

import { useEffect, useState } from 'react';

/**
 * Fixed, full-viewport ambient background layer — flowing chrome ribbons
 * lit with real specular highlights (feSpecularLighting on turbulence,
 * not just a blurred gradient blob), so the surface reads as reflective
 * liquid metal rather than fog. Present behind every page (added once in
 * layout.tsx). Inert: pointer-events:none, negative z-index, aria-hidden.
 */
export default function CyberSigilLayer() {
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const ribbons = [
    { cx: 160, cy: 200, rx: 420, ry: 110, rotate: -22 },
    { cx: 880, cy: 300, rx: 460, ry: 100, rotate: 18 },
    { cx: 380, cy: 760, rx: 480, ry: 120, rotate: -12 },
    { cx: 900, cy: 830, rx: 380, ry: 95, rotate: 26 },
  ];

  return (
    <svg className="liquid-layer" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="liquidChrome" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="softSource" />
          <feTurbulence type="fractalNoise" numOctaves="2" seed="7" stitchTiles="stitch" result="noise">
            {animate && (
              <animate
                attributeName="baseFrequency"
                values="0.003 0.008;0.009 0.003;0.003 0.008"
                dur="52s"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap in="softSource" in2="noise" scale="34" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feSpecularLighting in="noise" surfaceScale="6" specularConstant="1.1" specularExponent="16" lightingColor="#ffffff" result="spec">
            <feDistantLight azimuth="235" elevation="52" />
          </feSpecularLighting>
          <feComposite in="spec" in2="displaced" operator="in" result="specClipped" />
          <feComposite in="specClipped" in2="displaced" operator="arithmetic" k1="0" k2="1" k3="1.35" k4="0" />
        </filter>
      </defs>

      {ribbons.map((r, i) => (
        <g key={i} className={`liquid-blob liquid-blob-${(i % 3) + 1}`}>
          <ellipse
            cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
            transform={`rotate(${r.rotate} ${r.cx} ${r.cy})`}
            fill="#14171A"
            filter="url(#liquidChrome)"
          />
        </g>
      ))}
    </svg>
  );
}
