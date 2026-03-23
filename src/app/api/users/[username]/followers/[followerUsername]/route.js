import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
    
    const { username, followerUsername } = await params;
    
    // Only the profile owner can remove a follower from their own profile
    if (session.username !== username) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    await dbConnect();
    const follower = await User.findOne({ username: followerUsername });
    if (!follower) return NextResponse.json({ error: 'Follower not found.' }, { status: 404 });

    // Remove follower._id from my followers, and my session.id from their following
    await User.findByIdAndUpdate(session.id, { $pull: { followers: follower._id } });
    await User.findByIdAndUpdate(follower._id, { $pull: { following: session.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[follower DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
