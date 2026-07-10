import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          <b style={{ color: 'var(--text)' }}>Nocturna Compass</b><br />
          A curated map of the electronic<br />music ecosystem in Los Angeles.
        </div>
        <div className="foot-cols">
          <div>
            <b>Discover</b>
            <Link href="/tonight">Tonight in LA</Link><br />
            <Link href="/weekend">This weekend</Link><br />
            <Link href="/events">Event directory</Link><br />
            <Link href="/map">Map view</Link>
          </div>
          <div>
            <b>Community</b>
            <Link href="/submit">Submit an event</Link><br />
            <Link href="/submit">For promoters</Link><br />
            <Link href="/submit">For venues</Link>
          </div>
          <div>
            <b>Nocturna</b>
            <a href="https://instagram.com/nocturna_la_" target="_blank" rel="noopener">Instagram</a><br />
            <Link href="/#subscribe">Newsletter</Link>
          </div>
        </div>
        <div>© {new Date().getFullYear()} Nocturna · Los Angeles</div>
      </div>
    </footer>
  );
}
