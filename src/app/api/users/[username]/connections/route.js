import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(_request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

    const { username } = await params;

    // Connections list is private — only the profile owner can see it
    if (session.username !== username) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    await dbConnect();
    const target = await User.findOne({ username })
      .populate('followers', 'username avatarUrl bio')
      .populate('following', 'username avatarUrl bio')
      .lean();

    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({
      followers: target.followers || [],
      following: target.following || [],
    });
  } catch (err) {
    console.error('[connections GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
