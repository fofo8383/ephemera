'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Mock data (computed client-side only to avoid hydration mismatch) ────
function makePosts() {
  const now = Date.now();
  return [
    {
      _id: 'demo-1',
      username: 'marta.k',
      imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80',
      caption: 'last light over mitte.',
      comments: [
        { _id: 'c1a', username: 'felix__b', text: 'absolutely stunning' },
        { _id: 'c1b', username: 'yuna.r', text: 'which bridge is this?' },
      ],
      expiresAt: now + 3 * 3600 * 1000 + 22 * 60000,
      isOwner: false,
    },
    {
      _id: 'demo-2',
      username: 'felix__b',
      imageUrl: 'https://images.unsplash.com/photo-1517231925375-bf2cb42917a5?w=800&q=80',
      caption: 'flat white. 07:42.',
      comments: [
        { _id: 'c2a', username: 'marta.k', text: 'ritual' },
      ],
      expiresAt: now + 11 * 3600 * 1000 + 5 * 60000,
      isOwner: false,
    },
    {
      _id: 'demo-3',
      username: 'you',
      imageUrl: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=800&q=80',
      caption: 'studio session.',
      comments: [],
      expiresAt: now + 18 * 3600 * 1000 + 44 * 60000,
      isOwner: true,
    },
  ];
}


// ─── Countdown hook ───────────────────────────────────────────
function useCountdown(expiresAt) {
  const compute = useCallback(() => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }, [expiresAt]);

  const [label, setLabel] = useState(compute);
  useEffect(() => {
    const id = setInterval(() => setLabel(compute()), 1000);
    return () => clearInterval(id);
  }, [compute]);
  return label;
}

// ─── Single card ─────────────────────────────────────────────
function DemoPolaroid({ post }) {
  const [comments, setComments] = useState(post.comments);
  const [text, setText] = useState('');
  const [deleted, setDeleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const countdown = useCountdown(post.expiresAt);
  const urgent = post.expiresAt - Date.now() < 2 * 3600 * 1000;

  function addComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setComments((prev) => [...prev, {
      _id: `local-${Date.now()}`,
      username: 'you',
      text: text.trim(),
    }]);
    setText('');
  }

  if (deleted) return null;

  return (
    <>
      <div className="polaroid-card">
        <div className="polaroid-header">
          <div className="polaroid-username">
            <a href="#">@{post.username}</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`countdown-badge${urgent ? ' urgent' : ''}`}>
              ⏳ {countdown}
            </span>
            {post.isOwner && (
              confirmDelete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--danger)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>sure?</span>
                  <button onClick={() => setDeleted(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '2px 6px', fontSize: 10, minWidth: 24, height: 20 }}>y</button>
                  <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 10, minWidth: 24, height: 20 }}>n</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--text-muted)' }}
                  aria-label="Delete post"
                >
                  ✕
                </button>
              )
            )}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.imageUrl} alt={post.caption} className="polaroid-img" loading="lazy" />
        {post.caption && <div className="polaroid-caption">{post.caption}</div>}
      </div>

      <div className="comments-section">
        {comments.map((c) => (
          <div key={c._id} className="comment-item">
            <b>@{c.username}</b>
            <span>{c.text}</span>
          </div>
        ))}
        <form onSubmit={addComment} className="comment-form">
          <input
            type="text"
            className="comment-input"
            placeholder="add a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
          />
          <button type="submit" className="btn btn-ghost btn-sm" disabled={!text.trim()}>
            post
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Demo page ────────────────────────────────────────────────
export default function DemoPage() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { setPosts(makePosts()); }, []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Inline mini-navbar for demo */}
      <nav className="navbar" role="navigation">
        <div className="navbar-inner">
          <span className="navbar-logo">ephemera.</span>
          <div className="navbar-actions">
            <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              demo mode
            </span>
            <Link href="/signup" className="btn btn-primary btn-sm">join</Link>
          </div>
        </div>
      </nav>

      <main className="page container">
        <div className="masthead">
          <div className="masthead-logo">ephemera.</div>
          <div className="masthead-meta">
            one drop<br />per day
          </div>
        </div>

        {/* Demo banner */}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          padding: '10px 14px',
          border: '1px solid var(--border)',
          marginBottom: 28,
          lineHeight: 1.7,
        }}>
          ↳ interactive demo — comments are local only.
        </div>

        <div className="section-label">feed</div>
        {posts.map((post) => (
          <DemoPolaroid key={post._id} post={post} />
        ))}
      </main>
    </div>
  );
}
