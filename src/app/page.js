import Link from 'next/link';
import DotBackground from '@/components/DotBackground';

export const metadata = {
  title: 'ephemera. — one photo a day',
  description: 'A minimalist social network. Share one photo a day, gone after 24 hours.',
};

export default function LandingPage() {
  return (
    <main className="landing" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <DotBackground />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 800, padding: '0 20px' }}>
        <div className="landing-eyebrow">since 2026</div>
      <h1 style={{ whiteSpace: 'nowrap' }}>ephemera.</h1>
      <p className="landing-tagline">
        share moments, not data
      </p>
        <div className="landing-cta">
          <Link href="/signup" className="btn btn-primary">create account</Link>
          <Link href="/login" className="btn btn-outline">log in</Link>
        </div>
      </div>
    </main>
  );
}
