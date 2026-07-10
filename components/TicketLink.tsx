'use client';

export default function TicketLink({
  eventId, href, children, className,
}: { eventId: string; href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href} target="_blank" rel="noopener" className={className}
      onClick={() => {
        try {
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId, kind: 'ticket' }),
            keepalive: true,
          });
        } catch { /* tracking must never block navigation */ }
      }}
    >
      {children}
    </a>
  );
}
