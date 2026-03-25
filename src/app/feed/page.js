'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PolaroidCard from '@/components/PolaroidCard';

export default function FeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) { router.push('/login'); return; }
    if (!user) return;
    fetch('/api/feed')
      .then((r) => r.json())
      .then((data) => { setPosts(data.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, router]);

  function handleDelete(id) {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  if (user === undefined || loading) {
    return <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}><div className="spinner" /></main>;
  }

  return (
    <main className="page container">
      <div className="masthead">
        <div className="masthead-logo">ephemera.</div>
        <div className="masthead-meta">
          one drop<br />per day
        </div>
      </div>
      <div className="section-label">feed</div>
      {posts.length === 0 ? (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          pointerEvents: 'none',
        }}>
          <p style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--text-muted)',
            letterSpacing: '0.5px',
          }}>
            you&rsquo;re in — drop your first photo
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            opacity: 0.5,
          }}>
            <span style={{ transform: 'rotate(-30deg)', fontSize: 14, lineHeight: 1 }}>↑</span>
            <span>+ upload</span>
          </div>
        </div>
      ) : (
        posts.map((post) => (
          <PolaroidCard
            key={post._id}
            post={post}
            onDelete={handleDelete}
            currentUser={user}
          />
        ))
      )}
    </main>
  );
}
