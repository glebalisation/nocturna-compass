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
          <Link href="/events" className="nav-primary" onClick={close}>Events</Link>
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
            <span className="nav-toggle-label">Menu</span>
          </button>
        </div>

        <nav className={`nav-menu${open ? ' open' : ''}`} aria-label="Secondary">
          <Link href="/tonight" onClick={close}>Tonight in LA</Link>
          <Link href="/weekend" onClick={close}>This weekend</Link>
          <Link href="/about" onClick={close}>About us</Link>
          <Link href="/submit" onClick={close}>Submit an event</Link>
          <a href="https://instagram.com/nocturna_la_" target="_blank" rel="noopener" onClick={close}>Instagram</a>
          <Link href="/#subscribe" onClick={close}>Newsletter</Link>
        </nav>
      </div>
    </header>
  );
}
