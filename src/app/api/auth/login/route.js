import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setTokenCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const allowed = await checkRateLimit(ip, 'login', 10);
    if (!allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });

    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please continue with Google.' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

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
    });
    setTokenCookie(res, token);
    return res;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
