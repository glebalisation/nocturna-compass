import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <section className="container" style={{ maxWidth: 640, textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>404</div>
        <h1>Lost your <em>direction</em>?</h1>
        <p className="lede" style={{ margin: '20px auto 0' }}>
          This page doesn&apos;t exist — but tonight&apos;s events do.
        </p>
        <div style={{ marginTop: 32 }}>
          <Link href="/tonight" className="btn btn-primary">Explore tonight in LA</Link>
        </div>
      </section>
    </main>
  );
}
