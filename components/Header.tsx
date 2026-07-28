'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo" aria-label="Nocturna Compass home" onClick={close}>
          <img src="/nocturna-symbol.png" alt="" />
          Nocturna&nbsp;<span>Compass</span>
        </Link>

        <div className="nav-right">
          <nav className={`nav${open ? ' open' : ''}`} aria-label="Main">
            <Link href="/tonight" onClick={close}>Tonight</Link>
            <Link href="/weekend" onClick={close}>Weekend</Link>
            <Link href="/events" onClick={close}>All events</Link>
            <Link href="/map" onClick={close}>Map</Link>
            <Link href="/compass" onClick={close}>Compass</Link>
            <Link href="/submit" onClick={close}>Submit</Link>
          </nav>
          <Link href="/#subscribe" className="nav-cta" onClick={close}>Weekly guide</Link>
          <button
            type="button"
            className="nav-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
