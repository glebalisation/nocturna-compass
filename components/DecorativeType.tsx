/**
 * Oversized, barely-visible drifting words behind the hero — decoration only.
 * Server-renderable (pure CSS animation, no JS) so it costs nothing to hydrate.
 */
export default function DecorativeType() {
  return (
    <div className="decor-type" aria-hidden="true">
      <span className="decor-type-word decor-type-a">UNDERGROUND</span>
      <span className="decor-type-word decor-type-b">SIGNAL</span>
    </div>
  );
}
