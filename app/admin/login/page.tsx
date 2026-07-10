'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [err, setErr] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get('password');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) location.href = '/admin';
    else setErr(true);
  }

  return (
    <main>
      <section className="container" style={{ maxWidth: 420 }}>
        <div className="eyebrow">Nocturna staff only</div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Admin</h1>
        <form onSubmit={submit} style={{ marginTop: 32 }}>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoFocus />
          </div>
          <button className="btn btn-primary" type="submit">Enter</button>
          {err && <div className="notice err">Wrong password.</div>}
        </form>
      </section>
    </main>
  );
}
