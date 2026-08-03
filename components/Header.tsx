'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeSwitch from './ThemeSwitch';

const PRIMARY_LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/submit', label: 'Submit' },
  { href: '/compass', label: 'Compass' },
  { href: '/about', label: 'About us' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo" aria-label="Nocturna Compass home" onClick={close}>
          <img src="/nocturna-symbol.png" alt="" />
          <span className="logo-thin">Nocturna</span>
          <span className="logo-bold">Compass</span>
        </Link>

        <nav className="nav-primary-list" aria-label="Main">
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={close}>{l.label}</Link>
          ))}
        </nav>

        <div className="nav-right">
          <Link href="/#subscribe" className="nav-cta" onClick={close}>Weekly guide</Link>
          <ThemeSwitch />
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

        <nav className={`nav-menu${open ? ' open' : ''}`} aria-label="Mobile">
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={close}>{l.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
