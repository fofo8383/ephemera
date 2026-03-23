import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    await dbConnect();
    const user = await User.findOne({ username })
      .select('-passwordHash -passwordResetToken -passwordResetExpiry -email')
      .lean();
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    const enriched = posts.map((p) => ({
      ...p,
      expiresAt: new Date(p.createdAt).getTime() + 86400 * 1000,
    }));

    const session = await getSession();
    const isFollowing = session
      ? user.followers.some((f) => f.toString() === session.id)
      : false;

    return NextResponse.json({
      user: {
        ...user,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        isMe: session?.id === user._id.toString(),
      },
      posts: enriched,
    });
  } catch (err) {
    console.error('[users GET]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
