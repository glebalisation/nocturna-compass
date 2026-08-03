'use client';

import { useEffect, useRef, useState } from 'react';

const SEEDS = [3, 11, 19];
const PARALLAX_FACTOR = 0.18;

/**
 * Fixed, full-viewport ambient background layer — flowing chrome ribbons
 * lit with real specular highlights (feSpecularLighting on turbulence),
 * so the surface reads as reflective liquid metal. The turbulence itself
 * is static (computed once) rather than animated via SMIL — recomputing
 * feTurbulence/feSpecularLighting every frame was the source of visible
 * jank. Motion instead comes from cheap, GPU-friendly CSS transforms
 * (ambient drift) plus a scroll-linked parallax offset applied directly
 * to the root <svg>. Present behind every page (added once in
 * layout.tsx). Inert: pointer-events:none, negative z-index, aria-hidden.
 */
export default function CyberSigilLayer() {
  const [animate, setAnimate] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    function apply() {
      raf = 0;
      const el = svgRef.current;
      if (el) el.style.transform = `translateY(${window.scrollY * PARALLAX_FACTOR}px)`;
    }
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [animate]);

  const ribbons = [
    { cx: 160, cy: 200, rx: 420, ry: 110, rotate: -22 },
    { cx: 880, cy: 300, rx: 460, ry: 100, rotate: 18 },
    { cx: 380, cy: 760, rx: 480, ry: 120, rotate: -12 },
  ];

  return (
    <svg ref={svgRef} className="liquid-layer" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        {SEEDS.map((seed, i) => (
          <filter key={seed} id={`liquidChrome${i}`} x="-35%" y="-45%" width="170%" height="190%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="softSource" />
            <feTurbulence type="fractalNoise" numOctaves="2" seed={seed} baseFrequency="0.005 0.009" stitchTiles="stitch" result="noise" />
            <feDisplacementMap in="softSource" in2="noise" scale="34" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feSpecularLighting in="noise" surfaceScale="6" specularConstant="1.1" specularExponent="16" lightingColor="#ffffff" result="spec">
              <feDistantLight azimuth="235" elevation="52" />
            </feSpecularLighting>
            <feComposite in="spec" in2="displaced" operator="in" result="specClipped" />
            <feComposite in="specClipped" in2="displaced" operator="arithmetic" k1="0" k2="1" k3="1.35" k4="0" />
          </filter>
        ))}
      </defs>

      {ribbons.map((r, i) => (
        <g key={i} className={`liquid-blob liquid-blob-${i + 1}`}>
          <ellipse
            cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
            transform={`rotate(${r.rotate} ${r.cx} ${r.cy})`}
            fill="#14171A"
            filter={`url(#liquidChrome${i})`}
          />
        </g>
      ))}
    </svg>
  );
}
