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
    const isMe = session?.id === user._id.toString();
    const isFollowing = session
      ? user.followers.some((f) => f.toString() === session.id)
      : false;

    // Posts are private — only visible to the owner or followers
    const canSeePosts = isMe || isFollowing;
    let enriched = [];
    if (canSeePosts) {
      const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
      enriched = posts.map((p) => ({
        ...p,
        expiresAt: new Date(p.createdAt).getTime() + 86400 * 1000,
      }));
    }

    return NextResponse.json({
      user: {
        ...user,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        isMe,
      },
      posts: enriched,
    });
  } catch (err) {
    console.error('[users GET]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
