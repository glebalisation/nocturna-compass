import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo" aria-label="Nocturna Compass home">
          <img src="/nocturna-symbol.png" alt="" />
          Nocturna&nbsp;<span>Compass</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/tonight">Tonight</Link>
          <Link href="/weekend">Weekend</Link>
          <Link href="/events">All events</Link>
          <Link href="/map">Map</Link>
          <Link href="/compass">Compass</Link>
          <Link href="/submit">Submit</Link>
          <Link href="/#subscribe" className="nav-cta">Weekly guide</Link>
        </nav>
      </div>
    </header>
  );
}
