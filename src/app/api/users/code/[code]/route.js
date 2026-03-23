import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { code } = await params;
    const target = await User.findOne({ inviteCode: code.toLowerCase() }).lean();
    if (!target) return NextResponse.json({ error: 'No user found with that code.' }, { status: 404 });
    if (target._id.toString() === session.id) {
      return NextResponse.json({ error: "That's your own code." }, { status: 400 });
    }

    const me = await User.findById(session.id).select('following followRequests').lean();
    const isFollowing = me.following.map(String).includes(target._id.toString());
    const hasPendingRequest = target.followRequests?.some((r) => r.userId.toString() === session.id);

    return NextResponse.json({
      user: {
        username: target.username,
        bio: target.bio,
        followerCount: target.followers?.length ?? 0,
        isFollowing,
        hasPendingRequest,
      },
    });
  } catch (err) {
    console.error('[code GET]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { code } = await params;
    const target = await User.findOne({ inviteCode: code.toLowerCase() });
    if (!target) return NextResponse.json({ error: 'No user found with that code.' }, { status: 404 });
    if (target._id.toString() === session.id) {
      return NextResponse.json({ error: "That's your own code." }, { status: 400 });
    }

    if (target.followers.map(String).includes(session.id)) {
      return NextResponse.json({ error: 'Already following.' }, { status: 400 });
    }

    const alreadyRequested = target.followRequests?.some((r) => r.userId.toString() === session.id);
    if (alreadyRequested) {
      return NextResponse.json({ error: 'Request already sent.' }, { status: 400 });
    }

    await User.findByIdAndUpdate(target._id, {
      $push: { followRequests: { userId: session.id, username: session.username } },
      $addToSet: { inviteCodeUsedBy: session.id },
    });

    try {
      const { default: Notification } = await import('@/models/Notification');
      await Notification.create({
        toUserId:    target._id,
        fromUserId:  session.id,
        fromUsername:session.username,
        type:        'follow_request',
      });
    } catch (e) {
      console.error('[follow_request notification]', e);
    }

    return NextResponse.json({ ok: true, status: 'requested' });
  } catch (err) {
    console.error('[code POST]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
