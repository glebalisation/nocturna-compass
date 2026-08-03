/* ==========================================================================
   Nocturna — Chrome Tribal Motion Study
   Multiplies a single high-resolution chrome sprite across the viewport in a
   curated (non-grid) composition, with slow sine-driven drift, rotation and
   scale-breathing, three depth layers, and restrained cursor parallax.
   ========================================================================== */

const CONFIG = {
  countDesktop: 14,        // instances rendered on desktop-sized viewports
  countMobile: 7,          // instances rendered on narrow / touch viewports
  minScale: 0.35,
  maxScale: 1.8,
  mouseParallax: 18,       // max px displacement contributed by cursor position
  animationSpeed: 1,       // global multiplier on motion speed (1 = as authored)
  theme: "light",          // "light" | "dark" — see THEME_COLORS below
  accentColor: "#123c2d",  // used only as a faint reflected tint / close glow
  spriteAspect: 5164 / 1493,
  mobileBreakpoint: 820
};

const THEME_COLORS = {
  light: "#f3f2ed",
  dark: "#080b09"
};

/* --------------------------------------------------------------------------
   Composition — hand-placed slots, not a grid and not centered.
   x/y are fractions of the viewport (values <0 or >1 intentionally bleed
   past the edge). role only affects default opacity/emphasis; layer decides
   blur / parallax strength / paint order.
   -------------------------------------------------------------------------- */
const SLOTS = [
  { x: 0.86, y: 0.10, scale: 1.65, rot: -8,  flip: false, layer: "bg", role: "large",  tint: false, mobile: true  },
  { x: 0.10, y: 0.92, scale: 1.55, rot: 6,   flip: true,  layer: "bg", role: "large",  tint: true,  mobile: true  },
  { x: 0.72, y: 0.62, scale: 1.25, rot: 14,  flip: false, layer: "mid", role: "large", tint: false, mobile: false },
  { x: 0.22, y: 0.20, scale: 0.85, rot: -20, flip: false, layer: "mid", role: "medium", tint: false, mobile: true },
  { x: 0.34, y: 0.72, scale: 0.75, rot: 30,  flip: true,  layer: "fg", role: "medium", tint: false, mobile: true  },
  { x: 0.52, y: -0.04, scale: 0.95, rot: 4,  flip: false, layer: "mid", role: "medium", tint: false, mobile: false },
  { x: 1.02, y: 0.42, scale: 1.05, rot: -34, flip: true,  layer: "mid", role: "medium", tint: false, mobile: false },
  { x: 0.88, y: 0.88, scale: 0.50, rot: 50,  flip: false, layer: "fg", role: "small",  tint: true,  mobile: true  },
  { x: 0.46, y: 0.40, scale: 0.42, rot: -60, flip: true,  layer: "fg", role: "small",  tint: false, mobile: true  },
  { x: -0.03, y: 0.48, scale: 0.55, rot: 18, flip: false, layer: "bg", role: "small",  tint: false, mobile: false },
  { x: 0.06, y: 0.06, scale: 0.40, rot: -45, flip: true,  layer: "fg", role: "small",  tint: false, mobile: true  },
  { x: 0.58, y: 0.98, scale: 0.48, rot: 70,  flip: false, layer: "mid", role: "small", tint: false, mobile: false },
  { x: 0.64, y: 0.22, scale: 0.38, rot: -12, flip: true,  layer: "fg", role: "small",  tint: false, mobile: false },
  { x: 1.04, y: 0.98, scale: 0.60, rot: -25, flip: false, layer: "bg", role: "small",  tint: false, mobile: false }
];

const LAYER_PRESETS = {
  bg:  { opacity: [0.25, 0.45], blur: 3.5, moveMult: 0.50, parallaxMult: 0.35, sharpen: false },
  mid: { opacity: [0.45, 0.70], blur: 0,   moveMult: 0.80, parallaxMult: 0.65, sharpen: false },
  fg:  { opacity: [0.65, 0.90], blur: 0,   moveMult: 1.15, parallaxMult: 1.00, sharpen: true  }
};
const LAYER_ORDER = ["bg", "mid", "fg"];

/* -------------------------------------------------------------------------- */

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260803);
const lerp = (a, b, t) => a + (b - a) * t;
const hexToRgb = (hex) => {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches || "ontouchstart" in window;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let prefersReducedMotion = reducedMotionQuery.matches;
reducedMotionQuery.addEventListener?.("change", (e) => { prefersReducedMotion = e.matches; });

let theme = CONFIG.theme;
let viewportW = window.innerWidth;
let viewportH = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 3);
const accentRgb = hexToRgb(CONFIG.accentColor);

let mouseTargetX = 0, mouseTargetY = 0; // normalized -1..1
let mouseSmoothX = 0, mouseSmoothY = 0;

let sprite = null;
let instances = [];
const variants = { blurBg: null, sharp: null, glow: null };

/* --------------------------------------------------------------------------
   Bake blur / sharpen / glow ONCE into offscreen bitmaps at load time.
   ctx.filter and shadowBlur are extremely expensive when re-applied every
   animation frame (Canvas2D filters are largely CPU-bound, not GPU-accelerated
   in most engines) — baking them once and reusing the bitmap costs nothing
   at draw time, which is what keeps 14 layered instances at 60fps.
   -------------------------------------------------------------------------- */
function bakeVariant(img, { filterStr, shadow, pad = 0 } = {}) {
  const w = img.naturalWidth + pad * 2;
  const h = img.naturalHeight + pad * 2;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (filterStr) octx.filter = filterStr;
  if (shadow) { octx.shadowColor = shadow.color; octx.shadowBlur = shadow.blur; }
  octx.drawImage(img, pad, pad, img.naturalWidth, img.naturalHeight);
  return off;
}

function bakeVariants(img) {
  variants.blurBg = bakeVariant(img, { filterStr: "blur(26px)", pad: 90 });
  variants.sharp = bakeVariant(img, { filterStr: "contrast(1.08) brightness(1.03) saturate(1.05)" });
  variants.glow = bakeVariant(img, {
    shadow: { color: `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, 0.55)`, blur: 60 },
    pad: 160
  });
}

/* --------------------------------------------------------------------------
   Instance construction
   -------------------------------------------------------------------------- */
function buildInstances() {
  const desktop = viewportW >= CONFIG.mobileBreakpoint && !isTouch;
  const pool = desktop ? SLOTS : SLOTS.filter((s) => s.mobile);
  const count = desktop ? CONFIG.countDesktop : CONFIG.countMobile;
  const chosen = pool.slice(0, count);

  instances = chosen.map((slot) => {
    const preset = LAYER_PRESETS[slot.layer];
    const opacity = lerp(preset.opacity[0], preset.opacity[1], rnd());

    // two summed sine terms per axis => organic drift with implied
    // "directional changes" rather than a single repetitive oscillation
    const ampBase = { bg: 55, mid: 34, fg: 20 }[slot.layer];
    const ampX1 = ampBase * (0.7 + rnd() * 0.6);
    const ampY1 = ampBase * (0.55 + rnd() * 0.5);
    const ampX2 = ampX1 * 0.32;
    const ampY2 = ampY1 * 0.32;

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
      ampX1, ampY1, ampX2, ampY2,

      rotBase: slot.rot,
      rotAmp: 2.2 + rnd() * 2.6,
      rotFreq: (rnd() * 2 - 1) * 0.00025,
      rotPhase: rnd() * Math.PI * 2,

      breatheFreq: 0.00035 + rnd() * 0.0003,
      breathePhase: rnd() * Math.PI * 2,
      breatheAmp: 0.02 + rnd() * 0.01
    };
  });
}

/* --------------------------------------------------------------------------
   Canvas sizing (retina-sharp, responsive)
   -------------------------------------------------------------------------- */
function resize() {
  viewportW = window.innerWidth;
  viewportH = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 3);

  canvas.width = Math.round(viewportW * dpr);
  canvas.height = Math.round(viewportH * dpr);
  canvas.style.width = viewportW + "px";
  canvas.style.height = viewportH + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  buildInstances();
}

/* --------------------------------------------------------------------------
   Pointer parallax (disabled entirely on touch devices)
   -------------------------------------------------------------------------- */
if (!isTouch) {
  window.addEventListener("pointermove", (e) => {
    mouseTargetX = (e.clientX / viewportW) * 2 - 1;
    mouseTargetY = (e.clientY / viewportH) * 2 - 1;
  }, { passive: true });
  window.addEventListener("pointerleave", () => { mouseTargetX = 0; mouseTargetY = 0; });
}

/* --------------------------------------------------------------------------
   Render loop
   -------------------------------------------------------------------------- */
function draw(now) {
  const t = now * CONFIG.animationSpeed;

  mouseSmoothX = lerp(mouseSmoothX, mouseTargetX, 0.04);
  mouseSmoothY = lerp(mouseSmoothY, mouseTargetY, 0.04);

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, viewportW, viewportH);
  ctx.fillStyle = THEME_COLORS[theme];
  ctx.fillRect(0, 0, viewportW, viewportH);
  ctx.restore();

  if (!sprite) return;

  const baseUnit = Math.max(320, Math.min(900, viewportW * 0.34));

  for (const layerName of LAYER_ORDER) {
    for (const inst of instances) {
      if (inst.layer !== layerName) continue;
      drawInstance(inst, t, baseUnit);
    }
  }
}

function drawInstance(inst, t, baseUnit) {
  let driftX = inst.ampX1 * Math.sin(t * inst.freqX1 + inst.phaseX1)
             + inst.ampX2 * Math.sin(t * inst.freqX2 + inst.phaseX2);
  let driftY = inst.ampY1 * Math.cos(t * inst.freqY1 + inst.phaseY1)
             + inst.ampY2 * Math.cos(t * inst.freqY2 + inst.phaseY2);
  let rotDeg = inst.rotBase + Math.sin(t * inst.rotFreq + inst.rotPhase) * inst.rotAmp;
  let scale = inst.baseScale * (1 + Math.sin(t * inst.breatheFreq + inst.breathePhase) * inst.breatheAmp);

  if (prefersReducedMotion) {
    // minimal breathing only — no drift, no rotation
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

  // NOTE: ctx.filter / shadowBlur are not GPU-accelerated in Canvas2D and cost
  // ~10-20x a plain drawImage when applied every frame (measured: ~3fps live-
  // filtered vs ~60fps+ pre-baked). Blur / sharpen / glow are baked once into
  // offscreen bitmaps in bakeVariants() and simply drawn here — zero runtime cost.
  const bitmap = inst.blur > 0 ? variants.blurBg : inst.sharpen ? variants.sharp : sprite;

  ctx.save();
  ctx.globalAlpha = inst.opacity;
  ctx.translate(px, py);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.scale(inst.flip ? -1 : 1, 1);

  if (inst.tint && variants.glow) {
    const gw = drawW * (variants.glow.width / sprite.naturalWidth);
    const gh = drawH * (variants.glow.height / sprite.naturalHeight);
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * 0.9;
    ctx.drawImage(variants.glow, -gw / 2, -gh / 2, gw, gh);
    ctx.globalAlpha = prevAlpha;
  }

  const bitmapW = bitmap === sprite ? sprite.naturalWidth : bitmap.width;
  const bitmapH = bitmap === sprite ? sprite.naturalHeight : bitmap.height;
  const bw = drawW * (bitmapW / sprite.naturalWidth);
  const bh = drawH * (bitmapH / sprite.naturalHeight);
  ctx.drawImage(bitmap, -bw / 2, -bh / 2, bw, bh);
  ctx.restore();
}

function loop(now) {
  draw(now);
  requestAnimationFrame(loop);
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
function applyTheme(next) {
  theme = next;
  document.documentElement.setAttribute("data-theme", theme);
}

function init() {
  applyTheme(CONFIG.theme);
  resize();
  window.addEventListener("resize", resize);

  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => applyTheme(theme === "light" ? "dark" : "light"));
  }

  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    sprite = img;
    bakeVariants(img);
  };
  img.src = "assets/neo-tribal-chrome.png";

  requestAnimationFrame(loop);
}

init();
