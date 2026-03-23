'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (h < 1) return `${m}m ago`;
  if (d < 1) return `${h}h ago`;
  return `${d}d ago`;
}

function notifText(n) {
  switch (n.type) {
    case 'follow_request':  return 'wants to follow you';
    case 'follow_accepted': return 'accepted your follow request';
    case 'follow':          return 'started following you';
    case 'comment':         return `commented: "${n.commentText}"`;
    default:                return '';
  }
}

function NotifItem({ n, onAccept, onReject }) {
  const isRequest = n.type === 'follow_request';
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState(null); // 'accepted' | 'rejected'

  async function accept() {
    setActing(true);
    await onAccept(n.fromUserId);
    setDone('accepted');
    setActing(false);
  }
  async function reject() {
    setActing(true);
    await onReject(n.fromUserId);
    setDone('rejected');
    setActing(false);
  }

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '16px 0',
      borderBottom: '1px solid var(--border)',
      opacity: n.read && !isRequest ? 0.55 : 1,
    }}>
      {n.postImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={n.postImageUrl} alt="" style={{ width: 44, height: 44, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
      ) : (
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--text-muted)',
        }}>
          {n.fromUsername?.[0]?.toUpperCase()}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <Link href={`/profile/${n.fromUsername}`} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            @{n.fromUsername}
          </Link>
          {' '}{notifText(n)}
        </div>

        {isRequest && !done && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={accept} disabled={acting}>
              {acting ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'accept'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={reject} disabled={acting}>
              reject
            </button>
          </div>
        )}
        {done && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: done === 'accepted' ? 'var(--success)' : 'var(--text-muted)' }}>
            {done === 'accepted' ? '✓ accepted' : 'rejected'}
          </div>
        )}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: done ? 6 : 4, letterSpacing: '0.5px' }}>
          {timeAgo(n.createdAt)}
          {!n.read && !isRequest && (
            <span style={{ marginLeft: 8, background: 'var(--danger)', color: '#fff', padding: '1px 5px', fontSize: 9 }}>new</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) { router.push('/login'); return; }
    if (!user) return;

    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
        fetch('/api/notifications/read', { method: 'PATCH' }).catch(() => {});
      })
      .catch(() => setLoading(false));
  }, [user, router]);

  async function handleAccept(requesterId) {
    await fetch(`/api/follow-requests/${requesterId}`, { method: 'POST' });
  }
  async function handleReject(requesterId) {
    await fetch(`/api/follow-requests/${requesterId}`, { method: 'DELETE' });
  }

  if (user === undefined || loading) return (
    <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className="spinner" />
    </main>
  );

  const requests = notifications.filter((n) => n.type === 'follow_request');
  const others   = notifications.filter((n) => n.type !== 'follow_request');

  return (
    <main className="page container">
      <div className="page-title">notifications</div>

      {requests.length > 0 && (
        <>
          <div className="section-label">follow requests</div>
          {requests.map((n) => (
            <NotifItem key={n._id} n={n} onAccept={handleAccept} onReject={handleReject} />
          ))}
        </>
      )}

      {others.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: requests.length > 0 ? 32 : 0 }}>activity</div>
          {others.map((n) => <NotifItem key={n._id} n={n} onAccept={handleAccept} onReject={handleReject} />)}
        </>
      )}

      {notifications.length === 0 && (
        <div className="empty-state">
          <h2>all quiet</h2>
          <p>follow requests and activity will appear here.<br />share your invite code to get started.</p>
          <div style={{ marginTop: 20 }}>
            <Link href="/explore" className="btn btn-outline btn-sm">connect</Link>
          </div>
        </div>
      )}
    </main>
  );
}
