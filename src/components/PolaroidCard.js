'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function CommentText({ text }) {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <Link key={i} href={`/profile/${part.slice(1)}`} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {part}
          </Link>
        ) : (
          part
        )
      )}
    </span>
  );
}

function formatCountdown(expiresAt) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export default function PolaroidCard({ post, onDelete, currentUser }) {
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticker, setTicker] = useState(formatCountdown(post.expiresAt));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTicker(formatCountdown(post.expiresAt)), 30000);
    return () => clearInterval(interval);
  }, [post.expiresAt]);

  const urgent = post.expiresAt - Date.now() < 2 * 3600 * 1000;

  async function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${post._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/posts/${post._id}`, { method: 'DELETE' });
    setDeleting(false);
    setConfirmDelete(false);
    if (res.ok && onDelete) onDelete(post._id);
  }

  return (
    <>
      <div className="polaroid-card">
        <div className="polaroid-header">
          <div className="polaroid-username">
            <Link href={`/profile/${post.username}`}>@{post.username}</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`countdown-badge${urgent ? ' urgent' : ''}`}>
              {ticker}
            </span>
            {post.isOwner && (
              confirmDelete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--danger)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>sure?</span>
                  <button onClick={handleDelete} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '2px 6px', fontSize: 10, minWidth: 24, height: 20 }} disabled={deleting}>{deleting ? '...' : 'y'}</button>
                  <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 10, minWidth: 24, height: 20 }} disabled={deleting}>n</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--text-muted)' }}
                  aria-label="Delete post"
                >
                  ✕
                </button>
              )
            )}
          </div>
        </div>
        <img
          src={post.imageUrl}
          alt={post.caption || `Photo by @${post.username}`}
          className="polaroid-img"
          loading="lazy"
        />
        {post.caption && <div className="polaroid-caption">{post.caption}</div>}
      </div>

      <div className="comments-section">
        {comments.map((c, i) => (
          <div key={c._id || i} className="comment-item">
            <Link href={`/profile/${c.username}`} style={{ color: '#111', fontWeight: 700, flexShrink: 0 }}>@{c.username}</Link>
            <CommentText text={c.text} />
          </div>
        ))}
        {currentUser && (
          <form onSubmit={submitComment} className="comment-form">
            <input
              type="text"
              className="comment-input"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={300}
            />
            <button type="submit" className="btn btn-ghost btn-sm" disabled={submitting || !commentText.trim()}>
              Post
            </button>
          </form>
        )}
      </div>
    </>
  );
}
