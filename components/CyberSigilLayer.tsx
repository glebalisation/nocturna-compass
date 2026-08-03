'use client';

import { useEffect, useState } from 'react';

/**
 * Fixed, full-viewport ambient background layer — soft chrome/mercury
 * blobs continuously warped by an animated SVG turbulence/displacement
 * filter, so the surface actually flows like liquid metal rather than
 * reading as a rotating geometric diagram. Present behind every page
 * (added once in layout.tsx). Inert: pointer-events:none, negative
 * z-index, aria-hidden.
 */
export default function CyberSigilLayer() {
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  return (
    <svg className="liquid-layer" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="liquidChrome" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F4F3EE" />
          <stop offset="28%" stopColor="#C7C9C7" />
          <stop offset="55%" stopColor="#5B5F62" />
          <stop offset="80%" stopColor="#14171A" />
          <stop offset="100%" stopColor="#05070B" stopOpacity="0" />
        </radialGradient>

        <filter id="liquidTurb" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" numOctaves="3" seed="7" stitchTiles="stitch" result="noise">
            {animate && (
              <animate
                attributeName="baseFrequency"
                values="0.0035 0.006;0.007 0.004;0.0035 0.006"
                dur="60s"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <g className="liquid-blob liquid-blob-1">
        <ellipse cx="180" cy="200" rx="290" ry="250" fill="url(#liquidChrome)" filter="url(#liquidTurb)" />
      </g>
      <g className="liquid-blob liquid-blob-2">
        <ellipse cx="850" cy="360" rx="260" ry="300" fill="url(#liquidChrome)" filter="url(#liquidTurb)" />
      </g>
      <g className="liquid-blob liquid-blob-3">
        <ellipse cx="380" cy="860" rx="320" ry="260" fill="url(#liquidChrome)" filter="url(#liquidTurb)" />
      </g>
    </svg>
  );
}
