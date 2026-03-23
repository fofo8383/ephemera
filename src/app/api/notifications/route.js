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
