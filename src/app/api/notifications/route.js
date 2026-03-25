import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();

    const notifications = await Notification.find({ toUserId: session.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Purge notifications whose post has since been deleted (TTL gap)
    const postLinked = notifications.filter((n) => n.postId);
    if (postLinked.length > 0) {
      const { default: Post } = await import('@/models/Post');
      const postIds = [...new Set(postLinked.map((n) => n.postId.toString()))];
      const existingIds = await Post.find({ _id: { $in: postIds } }).distinct('_id');
      const existingSet = new Set(existingIds.map((id) => id.toString()));

      const orphanIds = postLinked
        .filter((n) => !existingSet.has(n.postId.toString()))
        .map((n) => n._id);

      if (orphanIds.length > 0) {
        // Fire-and-forget cleanup — don't block the response
        Notification.deleteMany({ _id: { $in: orphanIds } }).catch((e) =>
          console.error('[notifications GET] orphan cleanup', e)
        );
      }

      const live = notifications.filter(
        (n) => !n.postId || existingSet.has(n.postId.toString())
      );
      const unreadCount = live.filter((n) => !n.read).length;

      const { default: User } = await import('@/models/User');
      const me = await User.findById(session.id).select('followRequests').lean();
      const pendingCount = me?.followRequests?.length || 0;

      return NextResponse.json({ notifications: live, unreadCount, pendingCount });
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    const { default: User } = await import('@/models/User');
    const me = await User.findById(session.id).select('followRequests').lean();
    const pendingCount = me?.followRequests?.length || 0;

    return NextResponse.json({ notifications, unreadCount, pendingCount });
  } catch (err) {
    console.error('[notifications GET]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
