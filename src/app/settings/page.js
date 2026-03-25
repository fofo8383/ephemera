'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', bio: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef(null);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user === null) { router.push('/login'); return; }
    if (!user) return;
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setForm({ username: data.user.username || '', bio: data.user.bio || '' });
          setAvatarUrl(data.user.avatarUrl || '');
        }
      });
  }, [user, router]);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await fetch('/api/users/me/avatar', { method: 'POST', body: fd });
    const data = await res.json();
    setAvatarLoading(false);
    if (res.ok) {
      setAvatarUrl(data.avatarUrl);
      setUser((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
    } else {
      setError(data.error || 'Avatar upload failed.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    setUser((prev) => ({ ...prev, username: data.user.username }));
    setSuccess('profile updated.');
  }

  async function handleDelete() {
    if (deleteConfirm !== user?.username) {
      return setDeleteError('Username does not match.');
    }
    setDeleteError('');
    setDeleteLoading(true);
    const res = await fetch('/api/users/me/delete', { method: 'DELETE' });
    setDeleteLoading(false);
    if (!res.ok) {
      const data = await res.json();
      return setDeleteError(data.error || 'Something went wrong.');
    }
    // Clear local auth state and redirect
    setUser(null);
    router.push('/');
  }

  if (user === undefined) return (
    <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className="spinner" />
    </main>
  );

  return (
    <main className="page container">
      <div className="page-title">settings</div>

      {/* ── Avatar section ── */}
      <div className="section-label">photo</div>
      <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 20 }}>
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarLoading}
          aria-label="Change profile photo"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <div className="avatar" style={{ width: 72, height: 72, fontSize: 26, opacity: avatarLoading ? 0.5 : 1, position: 'relative' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="Your avatar" />
              : <span>{user?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
        </button>
        <div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarLoading}
          >
            {avatarLoading ? <span className="spinner" /> : 'change photo'}
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.5px' }}>
            jpg, png or webp — max 10mb
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* ── Profile section ── */}
      <div className="section-label">profile</div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} style={{ marginBottom: 48 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="username">username</label>
          <input
            id="username"
            className="form-input"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers and underscores only"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="bio">
            bio <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <textarea
            id="bio"
            className="form-input"
            placeholder="something about yourself…"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            maxLength={160}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'flex-end', fontFamily: 'var(--mono)' }}>
            {form.bio.length}/160
          </span>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'save changes'}
        </button>
      </form>

      {/* ── Danger zone ── */}
      <div className="section-label" style={{ color: 'var(--danger)', borderBottomColor: '#3a1010' }}>
        danger zone
      </div>
      <div style={{
        border: '1px solid #2a1010',
        padding: '20px',
        marginTop: 8,
      }}>
        <p style={{
          fontFamily: 'var(--mono)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: 16,
          lineHeight: 1.7,
        }}>
          permanently delete your account, all your drops, and remove yourself from everyone&rsquo;s followers.
          this cannot be undone.
        </p>
        <div className="form-group">
          <label className="form-label" htmlFor="delete-confirm" style={{ color: 'var(--danger)' }}>
            type your username to confirm
          </label>
          <input
            id="delete-confirm"
            className="form-input"
            type="text"
            placeholder={user?.username}
            value={deleteConfirm}
            onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
            style={{ borderColor: deleteError ? 'var(--danger)' : undefined }}
          />
        </div>
        {deleteError && <div className="alert alert-error">{deleteError}</div>}
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleteLoading || !deleteConfirm}
        >
          {deleteLoading ? <span className="spinner" style={{ borderTopColor: 'var(--danger)' }} /> : 'delete account'}
        </button>
      </div>

      {/* ── Log out ── */}
      <div className="section-label" style={{ marginTop: 40 }}>account</div>
      <button
        type="button"
        className="btn btn-outline"
        onClick={logout}
        style={{ marginTop: 8 }}
      >
        log out
      </button>
    </main>
  );
}
