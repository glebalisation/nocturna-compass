import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlayerProvider from '@/components/PlayerProvider';
import StickyPlayer from '@/components/StickyPlayer';
import CompassCursor from '@/components/CompassCursor';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nocturnacompass.com';

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: 'Nocturna Compass — Find your direction in LA nightlife',
    template: '%s · Nocturna Compass',
  },
  description:
    'Nocturna Compass tracks the best electronic music events, warehouse parties, clubs, DJs and underground gatherings across Los Angeles.',
  openGraph: {
    siteName: 'Nocturna Compass',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nocturna-theme');if(t==='night')document.documentElement.dataset.theme='night';}catch(e){}`,
          }}
        />
      </head>
      <body>
        <PlayerProvider>
          <Header />
          {children}
          <Footer />
          <StickyPlayer />
          <CompassCursor />
        </PlayerProvider>
      </body>
    </html>
  );
}
