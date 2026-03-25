import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setTokenCookie } from '@/lib/auth';
import crypto from 'crypto';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function exchangeCode(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${BASE_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  return res.json();
}

async function getGoogleUser(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

// Derive a clean username from a Google display name
async function generateUsername(displayName) {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'user';

  // Try base first, then append random digits until free
  let candidate = base;
  for (let i = 0; i < 10; i++) {
    const taken = await User.findOne({ username: candidate });
    if (!taken) return candidate;
    candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  // Fallback: use random hex
  return `user_${crypto.randomBytes(3).toString('hex')}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_cancelled`);
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.access_token) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
    }

    const googleUser = await getGoogleUser(tokens.access_token);
    if (!googleUser.email) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
    }

    await dbConnect();

    // Find by googleId, then fall back to email (links existing account)
    let user = await User.findOne({ googleId: googleUser.id })
      || await User.findOne({ email: googleUser.email.toLowerCase() });

    let isNewUser = false;

    if (user) {
      // Link Google ID to existing account if not already linked
      if (!user.googleId) {
        user.googleId = googleUser.id;
        await user.save();
      }
    } else {
      // Create new user with auto-generated username
      const username = await generateUsername(googleUser.name || googleUser.email.split('@')[0]);
      const inviteCode = crypto.randomBytes(4).toString('hex');
      user = await User.create({
        username,
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.id,
        avatarUrl: googleUser.picture || '',
        inviteCode,
      });
      isNewUser = true;
    }

    const token = signToken({ id: user._id.toString(), username: user.username });
    const destination = isNewUser ? `${BASE_URL}/choose-username` : `${BASE_URL}/feed`;
    const res = NextResponse.redirect(destination);
    setTokenCookie(res, token);
    return res;
  } catch (err) {
    console.error('[google/callback]', err);
    return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
  }
}
