/**
 * Faded, slow-moving abstract linework — contemporary tattoo-inspired
 * geometry, not a literal tribal pattern. Pure CSS animation (stroke-dashoffset
 * "drawing" motion + a slow drift), server-renderable, decorative only.
 */
export default function NeoTribalLines({ variant = 'compass' }: { variant?: 'compass' | 'divider' }) {
  if (variant === 'divider') {
    return (
      <svg className="neo-tribal neo-tribal-divider" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="neo-tribal-path neo-tribal-path-1" d="M -50 60 C 150 10, 300 110, 500 55 S 850 5, 1000 60 S 1200 90, 1260 50" />
        <path className="neo-tribal-path neo-tribal-path-2" d="M -50 80 C 200 120, 400 30, 600 75 S 950 110, 1100 40 S 1250 60, 1260 80" />
      </svg>
    );
  }
  return (
    <svg className="neo-tribal neo-tribal-compass" viewBox="0 0 400 400" aria-hidden="true">
      <path className="neo-tribal-path neo-tribal-path-1" d="M 30 340 C 90 260, 60 180, 130 130 S 260 60, 230 -10" />
      <path className="neo-tribal-path neo-tribal-path-2" d="M 380 40 C 320 120, 350 200, 280 250 S 150 320, 190 400" />
      <path className="neo-tribal-path neo-tribal-path-3" d="M 40 60 C 100 100, 90 160, 150 180 S 260 210, 250 280" />
    </svg>
  );
}
