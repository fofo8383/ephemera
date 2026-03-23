import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    await dbConnect();

    const users = await User.find({
      username: { $regex: `^${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' },
      ...(session ? { _id: { $ne: session.id } } : {}),
    })
      .select('username bio followers')
      .limit(20)
      .lean();

    const followingIds = session
      ? (await User.findById(session.id).select('following').lean())?.following?.map(String) ?? []
      : [];

    return NextResponse.json({
      users: users.map((u) => ({
        username: u.username,
        bio: u.bio,
        followerCount: u.followers?.length ?? 0,
        isFollowing: followingIds.includes(String(u._id)),
      })),
    });
  } catch (err) {
    console.error('[search]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
