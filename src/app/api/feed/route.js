import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const me = await User.findById(session.id).lean();
    if (!me) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // Include own posts + everyone they follow
    const feedUserIds = [me._id, ...me.following];

    const posts = await Post.find({ userId: { $in: feedUserIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Attach expiresAt for countdown timer
    const now = Date.now();
    const enriched = posts.map((p) => ({
      ...p,
      expiresAt: new Date(p.createdAt).getTime() + 86400 * 1000,
      isOwner: p.userId.toString() === session.id,
    }));

    return NextResponse.json({ posts: enriched });
  } catch (err) {
    console.error('[feed]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
