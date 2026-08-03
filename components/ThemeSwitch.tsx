'use client';

import { useEffect, useState } from 'react';

export default function ThemeSwitch() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    setNight(document.documentElement.dataset.theme === 'night');
  }, []);

  function toggle() {
    const next = !night;
    setNight(next);
    document.documentElement.dataset.theme = next ? 'night' : 'day';
    try {
      localStorage.setItem('nocturna-theme', next ? 'night' : 'day');
    } catch { /* storage unavailable — theme just won't persist */ }
  }

  return (
    <button
      type="button"
      className="light-switch"
      role="switch"
      aria-checked={night}
      aria-label={night ? 'Switch to day theme' : 'Switch to night theme'}
      onClick={toggle}
    >
      <span className="light-switch-screw light-switch-screw-top" aria-hidden="true" />
      <span className={`light-switch-toggle${night ? ' is-night' : ''}`} aria-hidden="true" />
      <span className="light-switch-screw light-switch-screw-bottom" aria-hidden="true" />
    </button>
  );
}
