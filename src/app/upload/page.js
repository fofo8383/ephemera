'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyPosted, setAlreadyPosted] = useState(false);
  const [existingPost, setExistingPost] = useState(null);

  useEffect(() => {
    if (user === null) { router.push('/login'); return; }
    if (!user) return;
    // Check if user already has a post today
    fetch(`/api/users/${user.username}`)
      .then((r) => r.json())
      .then((data) => {
        const posts = data.posts || [];
        if (posts.length > 0) {
          setAlreadyPosted(true);
          setExistingPost(posts[0]);
        }
      });
  }, [user, router]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Please select an image file.');
    if (f.size > 10 * 1024 * 1024) return setError('Image must be under 10 MB.');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError('Please choose a photo first.');
    setError('');
    setLoading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    const res = await fetch('/api/posts', { method: 'POST', body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Upload failed.');
    router.push('/feed');
  }

  if (user === undefined) return (
    <main className="page container" style={{ textAlign: 'center', paddingTop: 120 }}>
      <div className="spinner" />
    </main>
  );

  // Already posted today
  if (alreadyPosted && existingPost) {
    const expiresAt = new Date(existingPost.createdAt).getTime() + 86400 * 1000;
    const msLeft = expiresAt - Date.now();
    const hLeft = Math.floor(msLeft / 3600000);
    const mLeft = Math.floor((msLeft % 3600000) / 60000);
    return (
      <main className="page container">
        <div className="page-title">today&rsquo;s drop</div>
        <div style={{ border: '1px solid var(--border)', marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={existingPost.imageUrl} alt={existingPost.caption} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
        </div>
        <div className="alert alert-success">
          you&rsquo;ve already dropped today — expires in {hLeft}h {mLeft}m.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Link href="/feed" className="btn btn-primary btn-sm">back to feed</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page container">
      <div className="page-title">today&rsquo;s drop</div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div
          className="upload-dropzone"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Click to choose a photo"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            aria-label="Choose photo"
            style={{ display: 'none' }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="upload-preview" />
          ) : (
            <div className="upload-dropzone-label">
              <div style={{ fontSize: '24px', marginBottom: 8, fontFamily: 'var(--mono)' }}>[ + ]</div>
              <div>select today&rsquo;s image</div>
              <div style={{ fontSize: '10px', marginTop: 4, color: 'var(--text-muted)', letterSpacing: '1px' }}>jpeg · png · webp · max 10mb</div>
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="caption">caption <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
          <input
            id="caption"
            className="form-input"
            type="text"
            placeholder="A short description…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={100}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'flex-end', fontFamily: 'var(--mono)' }}>{caption.length}/100</span>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? <span className="spinner" /> : 'share'}
        </button>
      </form>
    </main>
  );
}
