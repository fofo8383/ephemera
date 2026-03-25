import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setTokenCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const allowed = await checkRateLimit(ip, 'signup', 5);
    if (!allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });

    await dbConnect();
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Explicitly generate invite code during signup
    const inviteCode = crypto.randomBytes(4).toString('hex');
    const user = await User.create({ username, email, passwordHash, inviteCode });

    const token = signToken({ id: user._id.toString(), username: user.username });
    const res = NextResponse.json({ 
      ok: true, 
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        inviteCode: user.inviteCode,
        bio: user.bio,
        avatarUrl: user.avatarUrl
      }
    }, { status: 201 });
    setTokenCookie(res, token);
    return res;
  } catch (err) {
    console.error('[SIGNUP_ERROR]', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return NextResponse.json({ 
      error: 'Server error.', 
      errorName: err.name, // Helpful for debugging production
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    }, { status: 500 });
  }
}
