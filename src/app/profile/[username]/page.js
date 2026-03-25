'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PolaroidCard from '@/components/PolaroidCard';
import Link from 'next/link';

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [connectionsModal, setConnectionsModal] = useState(null); // 'followers' | 'following' | null

  useEffect(() => {
    if (!connectionsModal) return;
    function onKey(e) { if (e.key === 'Escape') setConnectionsModal(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connectionsModal]);
  const [connectionsList, setConnectionsList] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [removingFollower, setRemovingFollower] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push('/feed'); return; }
        setProfile(data.user);
        setPosts(data.posts || []);
        setFollowing(data.user.isFollowing);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, router]);

  async function toggleFollow() {
    if (!user) { router.push('/login'); return; }
    setFollowLoading(true);
    const method = following ? 'DELETE' : 'POST';
    const res = await fetch(`/api/users/${username}/follow`, { method });
    if (res.ok) {
      setFollowing(!following);
      setProfile((p) => ({
        ...p,
        followerCount: following ? p.followerCount - 1 : p.followerCount + 1,
      }));
    }
    setFollowLoading(false);
  }

  function handleDelete(id) {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  async function openConnections(type) {
    // If no followers/following, don't open modal
    if (type === 'followers' && profile.followerCount === 0) return;
    if (type === 'following' && profile.followingCount === 0) return;
    
    setConnectionsModal(type);
    setConnectionsLoading(true);
    setRemovingFollower(null);
    try {
      const res = await fetch(`/api/users/${username}/connections`);
      const data = await res.json();
      setConnectionsList(data[type] || []);
    } catch (e) {
      console.error(e);
    }
    setConnectionsLoading(false);
  }

  async function confirmRemoveFollower(followerUsername) {
    const res = await fetch(`/api/users/${username}/followers/${followerUsername}`, { method: 'DELETE' });
    if (res.ok) {
      setConnectionsList((prev) => prev.filter((u) => u.username !== followerUsername));
      setProfile((p) => ({ ...p, followerCount: Math.max(0, p.followerCount - 1) }));
      setRemovingFollower(null);
    }
  }

  if (loading) return <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}><div className="spinner" /></main>;
  if (!profile) return null;

  const initials = (profile.username || '?')[0].toUpperCase();

  return (
    <main className="page container">
      <div className="profile-header">
        <div className="profile-header-inner">
          <div className="avatar">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`@${profile.username}`} /> : initials}
          </div>
          <div className="profile-meta">
            <div className="profile-username">@{profile.username}</div>
            {profile.bio && <div className="profile-bio">{profile.bio}</div>}
            <div className="profile-stats">
              <div 
                className="profile-stat" 
                onClick={() => openConnections('followers')}
                style={{ cursor: profile.followerCount > 0 ? 'pointer' : 'default' }}
              >
                <span className="profile-stat-value">{profile.followerCount}</span>
                <span className="profile-stat-label">followers</span>
              </div>
              <div 
                className="profile-stat" 
                onClick={() => openConnections('following')}
                style={{ cursor: profile.followingCount > 0 ? 'pointer' : 'default' }}
              >
                <span className="profile-stat-value">{profile.followingCount}</span>
                <span className="profile-stat-label">following</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{posts.length}</span>
                <span className="profile-stat-label">post{posts.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {profile.isMe ? (
              <Link href="/settings" className="btn btn-outline btn-sm">edit profile</Link>
            ) : (
              <button
                onClick={toggleFollow}
                className={`btn btn-sm ${following ? 'btn-outline' : 'btn-primary'}`}
                disabled={followLoading}
              >
                {followLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : following ? 'unfollow' : 'follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="section-label">drops</div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>no drops yet.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PolaroidCard
            key={post._id}
            post={{ ...post, isOwner: profile.isMe }}
            onDelete={handleDelete}
            currentUser={user}
          />
        ))
      )}

      {/* ── Connections Modal ── */}
      {connectionsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(4px)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
            width: '100%', maxWidth: 400,
            maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 16 }}>{connectionsModal}</h3>
              <button 
                onClick={() => setConnectionsModal(null)}
                className="btn btn-ghost btn-sm" 
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                ✕
              </button>
            </div>
            
            {connectionsLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
            ) : (
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {connectionsList.map((u) => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius)', flexShrink: 0,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text-muted)',
                      overflow: 'hidden'
                    }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/profile/${u.username}`} onClick={() => setConnectionsModal(null)} style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text-primary)' }}>
                        @{u.username}
                      </Link>
                      {u.bio && <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.bio}</div>}
                    </div>
                    
                    {profile.isMe && connectionsModal === 'followers' && (
                      <div style={{ flexShrink: 0 }}>
                        {removingFollower === u.username ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--danger)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>sure?</span>
                            <button onClick={() => confirmRemoveFollower(u.username)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '2px 6px', fontSize: 10 }}>y</button>
                            <button onClick={() => setRemovingFollower(null)} className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 10 }}>n</button>
                          </div>
                        ) : (
                          <button onClick={() => setRemovingFollower(u.username)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>
                            remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
