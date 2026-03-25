import Link from 'next/link';
import DotBackground from '@/components/DotBackground';

export const metadata = {
  title: 'ephemera. — one photo a day',
  description: 'A minimalist social network. Share one photo a day, gone after 24 hours.',
};

export default function LandingPage() {
  return (
    <main className="landing" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <DotBackground />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 640, padding: '0 32px', textAlign: 'center' }}>
        <div className="landing-eyebrow" style={{ marginBottom: 24 }}>one photo · one day · gone forever</div>
        <h1 style={{ whiteSpace: 'nowrap', marginBottom: 20 }}>ephemera.</h1>
        <p className="landing-tagline" style={{ borderLeft: 'none', paddingLeft: 0, textAlign: 'center', margin: '0 auto 40px', maxWidth: 280 }}>
          share moments, not data
        </p>
        <div className="landing-cta" style={{ justifyContent: 'center' }}>
          <Link href="/signup" className="btn btn-primary">create account</Link>
          <Link href="/login" className="btn btn-outline">log in</Link>
        </div>
      </div>
    </main>
  );
}
