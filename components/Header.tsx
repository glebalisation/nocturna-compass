import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo" aria-label="Nocturna Compass home">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="17" stroke="#2E8C5D" strokeWidth="1.5" />
            <path d="M20 6 L24 20 L20 34 L16 20 Z" fill="#8FE3B0" />
            <circle cx="20" cy="20" r="2.4" fill="#070908" />
          </svg>
          Nocturna&nbsp;<span>Compass</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/tonight">Tonight</Link>
          <Link href="/weekend">Weekend</Link>
          <Link href="/events">All events</Link>
          <Link href="/map">Map</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/#subscribe" className="nav-cta">Weekly guide</Link>
        </nav>
      </div>
    </header>
  );
}
