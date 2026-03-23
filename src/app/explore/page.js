'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ConnectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null); // { username, bio, followerCount, isFollowing, hasPendingRequest }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  const handleLookup = useCallback(async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setError('');
    setResult(null);
    setActionDone(false);
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    const res = await fetch(`/api/users/code/${trimmed}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Code not found.');
    setResult(data.user);
  }, [code, user, router]);

  const handleRequest = useCallback(async () => {
    const trimmed = code.trim().toLowerCase();
    setLoading(true);
    const res = await fetch(`/api/users/code/${trimmed}`, { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    setActionDone(true);
    setResult((r) => ({ ...r, hasPendingRequest: true }));
  }, [code]);

  if (user === undefined) return (
    <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className="spinner" />
    </main>
  );

  return (
    <main className="page container">
      <div className="page-title">connect</div>

      {/* ── Enter a code ── */}
      <div className="section-label">enter invite code</div>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
        enter someone&rsquo;s 8-character invite code to find and follow them.
        you can find your own code in settings.
      </p>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. a1b2c3d4"
          value={code}
          onChange={(e) => { setCode(e.target.value.toLowerCase()); setError(''); setResult(null); setActionDone(false); }}
          maxLength={8}
          style={{ flex: 1, fontFamily: 'var(--mono)', letterSpacing: '2px', textTransform: 'lowercase' }}
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={loading || code.trim().length < 6}>
          {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'find'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div style={{
          border: '1px solid var(--border)',
          padding: '20px',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <Link
                href={`/profile/${result.username}`}
                style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}
              >
                @{result.username}
              </Link>
              {result.bio && (
                <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {result.bio}
                </p>
              )}
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.5px' }}>
                {result.followerCount} follower{result.followerCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              {result.isFollowing ? (
                <span className="btn btn-outline btn-sm" style={{ cursor: 'default' }}>following</span>
              ) : result.hasPendingRequest ? (
                <span className="btn btn-outline btn-sm" style={{ cursor: 'default', color: 'var(--text-muted)' }}>requested</span>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleRequest} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'request to follow'}
                </button>
              )}
            </div>
          </div>
          {actionDone && (
            <div className="alert alert-success" style={{ marginTop: 12, marginBottom: 0 }}>
              follow request sent — they&rsquo;ll need to accept it.
            </div>
          )}
        </div>
      )}

      {/* ── Your invite code ── */}
      {user && (
        <>
          <div className="section-label">your code</div>
          <div style={{
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '4px',
                color: 'var(--text-primary)',
              }}>
                {user.inviteCode ?? '········'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '1px', textTransform: 'uppercase' }}>
                share this with friends to let them follow you
              </div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(user.inviteCode ?? '');
              }}
            >
              copy
            </button>
          </div>
        </>
      )}
    </main>
  );
}
