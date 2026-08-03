'use client';

import { useEffect, useRef } from 'react';

/* ==========================================================================
   Chrome tribal ambient background — site-wide, fixed, behind all content.
   Ported from the standalone /public/motion-study prototype: same curated
   composition and motion model, minus the opaque theme fill (this layer is
   transparent so the site's own --ink background shows through) and minus
   the demo HUD. Wrapper opacity is the "30% transparent" knob — see BG_OPACITY.
   ========================================================================== */

const CONFIG = {
  countDesktop: 14,
  countMobile: 7,
  mouseParallax: 18,
  animationSpeed: 1,
  accentColor: '#123c2d',
  spriteAspect: 5164 / 1493,
  mobileBreakpoint: 820,
};

const BG_OPACITY = 0.3; // requested: layer sits at 30% opacity over the site

type Layer = 'bg' | 'mid' | 'fg';

type Slot = {
  x: number; y: number; scale: number; rot: number;
  flip: boolean; layer: Layer; tint: boolean; mobile: boolean;
};

const SLOTS: Slot[] = [
  { x: 0.86, y: 0.10, scale: 1.65, rot: -8,  flip: false, layer: 'bg', tint: false, mobile: true  },
  { x: 0.10, y: 0.92, scale: 1.55, rot: 6,   flip: true,  layer: 'bg', tint: true,  mobile: true  },
  { x: 0.72, y: 0.62, scale: 1.25, rot: 14,  flip: false, layer: 'mid', tint: false, mobile: false },
  { x: 0.22, y: 0.20, scale: 0.85, rot: -20, flip: false, layer: 'mid', tint: false, mobile: true  },
  { x: 0.34, y: 0.72, scale: 0.75, rot: 30,  flip: true,  layer: 'fg', tint: false, mobile: true  },
  { x: 0.52, y: -0.04, scale: 0.95, rot: 4,  flip: false, layer: 'mid', tint: false, mobile: false },
  { x: 1.02, y: 0.42, scale: 1.05, rot: -34, flip: true,  layer: 'mid', tint: false, mobile: false },
  { x: 0.88, y: 0.88, scale: 0.50, rot: 50,  flip: false, layer: 'fg', tint: true,  mobile: true  },
  { x: 0.46, y: 0.40, scale: 0.42, rot: -60, flip: true,  layer: 'fg', tint: false, mobile: true  },
  { x: -0.03, y: 0.48, scale: 0.55, rot: 18, flip: false, layer: 'bg', tint: false, mobile: false },
  { x: 0.06, y: 0.06, scale: 0.40, rot: -45, flip: true,  layer: 'fg', tint: false, mobile: true  },
  { x: 0.58, y: 0.98, scale: 0.48, rot: 70,  flip: false, layer: 'mid', tint: false, mobile: false },
  { x: 0.64, y: 0.22, scale: 0.38, rot: -12, flip: true,  layer: 'fg', tint: false, mobile: false },
  { x: 1.04, y: 0.98, scale: 0.60, rot: -25, flip: false, layer: 'bg', tint: false, mobile: false },
];

const LAYER_PRESETS: Record<Layer, { opacity: [number, number]; blur: number; moveMult: number; parallaxMult: number; sharpen: boolean }> = {
  bg:  { opacity: [0.25, 0.45], blur: 3.5, moveMult: 0.50, parallaxMult: 0.35, sharpen: false },
  mid: { opacity: [0.45, 0.70], blur: 0,   moveMult: 0.80, parallaxMult: 0.65, sharpen: false },
  fg:  { opacity: [0.65, 0.90], blur: 0,   moveMult: 1.15, parallaxMult: 1.00, sharpen: true },
};
const LAYER_ORDER: Layer[] = ['bg', 'mid', 'fg'];

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexToRgb = (hex: string) => {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)] as const;
};

type Instance = Slot & {
  baseScale: number; opacity: number; blur: number; sharpen: boolean;
  parallaxMult: number; moveMult: number;
  phaseX1: number; phaseY1: number; phaseX2: number; phaseY2: number;
  freqX1: number; freqY1: number; freqX2: number; freqY2: number;
  ampX1: number; ampY1: number; ampX2: number; ampY2: number;
  rotBase: number; rotAmp: number; rotFreq: number; rotPhase: number;
  breatheFreq: number; breathePhase: number; breatheAmp: number;
};

export default function ChromeTribalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches || 'ontouchstart' in window;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;
    const onReducedMotionChange = (e: MediaQueryListEvent) => { prefersReducedMotion = e.matches; };
    reducedMotionQuery.addEventListener?.('change', onReducedMotionChange);

    const rnd = mulberry32(20260803);
    const accentRgb = hexToRgb(CONFIG.accentColor);

    let viewportW = window.innerWidth;
    let viewportH = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 3);

    let mouseTargetX = 0, mouseTargetY = 0;
    let mouseSmoothX = 0, mouseSmoothY = 0;

    let sprite: HTMLImageElement | null = null;
    let instances: Instance[] = [];
    const variants: { blurBg: HTMLCanvasElement | null; sharp: HTMLCanvasElement | null; glow: HTMLCanvasElement | null } = {
      blurBg: null, sharp: null, glow: null,
    };

    function bakeVariant(img: HTMLImageElement, opts: { filterStr?: string; shadow?: { color: string; blur: number }; pad?: number }) {
      const pad = opts.pad || 0;
      const w = img.naturalWidth + pad * 2;
      const h = img.naturalHeight + pad * 2;
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const octx = off.getContext('2d')!;
      if (opts.filterStr) octx.filter = opts.filterStr;
      if (opts.shadow) { octx.shadowColor = opts.shadow.color; octx.shadowBlur = opts.shadow.blur; }
      octx.drawImage(img, pad, pad, img.naturalWidth, img.naturalHeight);
      return off;
    }

    function bakeVariants(img: HTMLImageElement) {
      variants.blurBg = bakeVariant(img, { filterStr: 'blur(26px)', pad: 90 });
      variants.sharp = bakeVariant(img, { filterStr: 'contrast(1.08) brightness(1.03) saturate(1.05)' });
      variants.glow = bakeVariant(img, {
        shadow: { color: `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, 0.55)`, blur: 60 },
        pad: 160,
      });
    }

    function buildInstances() {
      const desktop = viewportW >= CONFIG.mobileBreakpoint && !isTouch;
      const pool = desktop ? SLOTS : SLOTS.filter((s) => s.mobile);
      const count = desktop ? CONFIG.countDesktop : CONFIG.countMobile;
      const chosen = pool.slice(0, count);

      instances = chosen.map((slot) => {
        const preset = LAYER_PRESETS[slot.layer];
        const opacity = lerp(preset.opacity[0], preset.opacity[1], rnd());
        const ampBase = { bg: 55, mid: 34, fg: 20 }[slot.layer];
        const ampX1 = ampBase * (0.7 + rnd() * 0.6);
        const ampY1 = ampBase * (0.55 + rnd() * 0.5);

        return {
          ...slot,
          baseScale: slot.scale,
          opacity,
          blur: preset.blur,
          sharpen: preset.sharpen,
          parallaxMult: preset.parallaxMult,
          moveMult: preset.moveMult,
          phaseX1: rnd() * Math.PI * 2,
          phaseY1: rnd() * Math.PI * 2,
          phaseX2: rnd() * Math.PI * 2,
          phaseY2: rnd() * Math.PI * 2,
          freqX1: (0.00006 + rnd() * 0.00006) * preset.moveMult,
          freqY1: (0.00005 + rnd() * 0.00006) * preset.moveMult,
          freqX2: (0.000018 + rnd() * 0.00002) * preset.moveMult,
          freqY2: (0.00002 + rnd() * 0.00002) * preset.moveMult,
          ampX1, ampY1, ampX2: ampX1 * 0.32, ampY2: ampY1 * 0.32,
          rotBase: slot.rot,
          rotAmp: 2.2 + rnd() * 2.6,
          rotFreq: (rnd() * 2 - 1) * 0.00025,
          rotPhase: rnd() * Math.PI * 2,
          breatheFreq: 0.00035 + rnd() * 0.0003,
          breathePhase: rnd() * Math.PI * 2,
          breatheAmp: 0.02 + rnd() * 0.01,
        };
      });
    }

    function resize() {
      viewportW = window.innerWidth;
      viewportH = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas!.width = Math.round(viewportW * dpr);
      canvas!.height = Math.round(viewportH * dpr);
      canvas!.style.width = viewportW + 'px';
      canvas!.style.height = viewportH + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'high';
      buildInstances();
    }

    function onPointerMove(e: PointerEvent) {
      mouseTargetX = (e.clientX / viewportW) * 2 - 1;
      mouseTargetY = (e.clientY / viewportH) * 2 - 1;
    }
    function onPointerLeave() { mouseTargetX = 0; mouseTargetY = 0; }

    if (!isTouch) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave);
    }

    function drawInstance(inst: Instance, t: number, baseUnit: number) {
      let driftX = inst.ampX1 * Math.sin(t * inst.freqX1 + inst.phaseX1) + inst.ampX2 * Math.sin(t * inst.freqX2 + inst.phaseX2);
      let driftY = inst.ampY1 * Math.cos(t * inst.freqY1 + inst.phaseY1) + inst.ampY2 * Math.cos(t * inst.freqY2 + inst.phaseY2);
      let rotDeg = inst.rotBase + Math.sin(t * inst.rotFreq + inst.rotPhase) * inst.rotAmp;
      let scale = inst.baseScale * (1 + Math.sin(t * inst.breatheFreq + inst.breathePhase) * inst.breatheAmp);

      if (prefersReducedMotion) {
        driftX = 0; driftY = 0;
        rotDeg = inst.rotBase;
        scale = inst.baseScale * (1 + Math.sin(t * inst.breatheFreq * 0.6 + inst.breathePhase) * 0.012);
      }

      const parallaxX = isTouch || prefersReducedMotion ? 0 : mouseSmoothX * CONFIG.mouseParallax * inst.parallaxMult;
      const parallaxY = isTouch || prefersReducedMotion ? 0 : mouseSmoothY * CONFIG.mouseParallax * inst.parallaxMult;

      const px = inst.x * viewportW + driftX + parallaxX;
      const py = inst.y * viewportH + driftY + parallaxY;
      const drawW = baseUnit * scale;
      const drawH = drawW / CONFIG.spriteAspect;

      const bitmap: HTMLCanvasElement | HTMLImageElement =
        inst.blur > 0 && variants.blurBg ? variants.blurBg : inst.sharpen && variants.sharp ? variants.sharp : sprite!;

      ctx!.save();
      ctx!.globalAlpha = inst.opacity;
      ctx!.translate(px, py);
      ctx!.rotate((rotDeg * Math.PI) / 180);
      ctx!.scale(inst.flip ? -1 : 1, 1);

      if (inst.tint && variants.glow) {
        const gw = drawW * (variants.glow.width / sprite!.naturalWidth);
        const gh = drawH * (variants.glow.height / sprite!.naturalHeight);
        const prevAlpha = ctx!.globalAlpha;
        ctx!.globalAlpha = prevAlpha * 0.9;
        ctx!.drawImage(variants.glow, -gw / 2, -gh / 2, gw, gh);
        ctx!.globalAlpha = prevAlpha;
      }

      const bitmapW = bitmap === sprite ? sprite!.naturalWidth : (bitmap as HTMLCanvasElement).width;
      const bitmapH = bitmap === sprite ? sprite!.naturalHeight : (bitmap as HTMLCanvasElement).height;
      const bw = drawW * (bitmapW / sprite!.naturalWidth);
      const bh = drawH * (bitmapH / sprite!.naturalHeight);
      ctx!.drawImage(bitmap, -bw / 2, -bh / 2, bw, bh);
      ctx!.restore();
    }

    function draw(now: number) {
      const t = now * CONFIG.animationSpeed;
      mouseSmoothX = lerp(mouseSmoothX, mouseTargetX, 0.04);
      mouseSmoothY = lerp(mouseSmoothY, mouseTargetY, 0.04);

      ctx!.save();
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, viewportW, viewportH); // transparent — the site's own bg shows through
      ctx!.restore();

      if (!sprite) return;
      const baseUnit = Math.max(320, Math.min(900, viewportW * 0.34));
      for (const layerName of LAYER_ORDER) {
        for (const inst of instances) {
          if (inst.layer !== layerName) continue;
          drawInstance(inst, t, baseUnit);
        }
      }
    }

    let rafId = 0;
    function loop(now: number) {
      draw(now);
      rafId = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { sprite = img; bakeVariants(img); };
    img.src = '/chrome-tribal.png';

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      reducedMotionQuery.removeEventListener?.('change', onReducedMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: BG_OPACITY,
      }}
    />
  );
}
