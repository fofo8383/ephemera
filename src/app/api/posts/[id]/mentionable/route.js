import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('q')?.slice(0, 20).toLowerCase() ?? '';
    // Escape regex special characters to prevent ReDoS
    const q = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    await dbConnect();
    const { id } = await params;
    const post = await Post.findById(id).select('userId username').lean();
    if (!post) return NextResponse.json({ users: [] });

    // Fetch both following lists in parallel
    const [commenter, uploader] = await Promise.all([
      User.findById(session.id).select('following').lean(),
      User.findById(post.userId).select('following').lean(),
    ]);

    const commenterFollowing = new Set(commenter.following.map((id) => id.toString()));
    const uploaderFollowing  = new Set(uploader.following.map((id) => id.toString()));

    // Valid targets: uploader themselves + users in both following sets
    const uploaderIdStr = post.userId.toString();
    const candidateIds = [
      uploaderIdStr,
      ...[...commenterFollowing].filter((id) => uploaderFollowing.has(id)),
    ].filter((id) => id !== session.id); // never suggest yourself

    const users = await User.find({
      _id: { $in: candidateIds },
      username: q ? { $regex: `^${q}`, $options: 'i' } : { $exists: true },
    })
      .select('username avatarUrl')
      .limit(6)
      .lean();

    return NextResponse.json({ users });
  } catch (err) {
    console.error('[mentionable GET]', err);
    return NextResponse.json({ users: [] });
  }
}
