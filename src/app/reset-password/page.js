'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match.');
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Something went wrong.');
    setSuccess(true);
    setTimeout(() => router.push('/login'), 2500);
  }

  if (!token) {
    return <div className="alert alert-error">Invalid reset link.</div>;
  }

  return success ? (
    <div className="alert alert-success">Password updated! Redirecting to login…</div>
  ) : (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="password">New password</label>
        <input
          id="password"
          className="form-input"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required autoFocus
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="confirm">Confirm password</label>
        <input
          id="confirm"
          className="form-input"
          type="password"
          placeholder="Repeat your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? <span className="spinner" /> : 'Set new password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">ephemera.</div>
        <div className="auth-subtitle">Set a new password</div>
        <Suspense fallback={<div className="spinner" />}>
          <ResetForm />
        </Suspense>
        <div className="auth-footer">
          <Link href="/login">Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
