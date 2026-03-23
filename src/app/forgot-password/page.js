'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">ephemera.</div>
        <div className="auth-subtitle">Reset your password</div>
        {sent ? (
          <div className="alert alert-success">
            If an account with that email exists, we&rsquo;ve sent a reset link. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send reset link'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          <Link href="/login">Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
