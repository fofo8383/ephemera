import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';

export async function GET(_request, { params }) {
  try {
    const { username } = await params;
    await dbConnect();
    const user = await User.findOne({ username })
      .select('-passwordHash -passwordResetToken -passwordResetExpiry -email')
      .lean();
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

    const isMe = session.id === user._id.toString();
    const isFollowing = user.followers.some((f) => f.toString() === session.id);
    const canSee = isMe || isFollowing;

    // Non-followers get a locked response — username only, no details
    if (!canSee) {
      return NextResponse.json({
        user: { username: user.username, isMe: false, isFollowing: false, locked: true },
        posts: [],
      });
    }

    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    const enriched = posts.map((p) => ({
      ...p,
      expiresAt: new Date(p.createdAt).getTime() + 86400 * 1000,
    }));

    return NextResponse.json({
      user: {
        ...user,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        isMe,
        locked: false,
      },
      posts: enriched,
    });
  } catch (err) {
    console.error('[users GET]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
