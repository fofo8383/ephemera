'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PolaroidCard from '@/components/PolaroidCard';
import Link from 'next/link';

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
        <div className="empty-state">
          <h2>nothing here yet</h2>
          <p>follow people to see their daily drops,<br />or share your own moment.</p>
          <div style={{ marginTop: 24 }}>
            <Link href="/upload" className="btn btn-primary btn-sm">+ upload today</Link>
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
