'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  // Poll for unread notification count + pending follow requests every 60s
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    function fetchCount() {
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((data) => {
          setUnread((data.unreadCount || 0) + (data.pendingCount || 0));
        })
        .catch(() => {});
    }
    fetchCount();
    const id = setInterval(fetchCount, 30000); // 30s
    return () => clearInterval(id);
  }, [user]);

  // Clear badge when visiting notifications page
  useEffect(() => {
    if (pathname === '/notifications') setUnread(0);
  }, [pathname]);

  const hideNav = ['/', '/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);
  if (hideNav && !user) return null;

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link href={user ? '/feed' : '/'} className="navbar-logo">ephemera.</Link>
        <div className="navbar-actions">
          {user ? (
            <>
              <Link href="/upload" className="btn btn-primary btn-sm">+ upload</Link>
              <Link href="/explore" className="btn btn-ghost btn-sm">connect</Link>
              <Link href="/notifications" className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
                notifs
                {unread > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 6, right: 4,
                    background: '#ffffff', // Clean white as requested
                    width: 7, height: 7,
                    borderRadius: '50%',
                    display: 'block',
                    pointerEvents: 'none',
                  }} />
                )}
              </Link>
              <Link href={`/profile/${user.username?.toLowerCase()}`} className="btn btn-ghost btn-sm">
                @{user.username}
              </Link>
              <Link href="/settings" className="btn btn-ghost btn-sm">settings</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">log in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">join</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
