import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

// Accept a follow request
export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { requesterId } = await params;

    const me = await User.findById(session.id);
    
    // Remove the original follow_request notification unconditionally
    // (helps clear stuck ghost notifications if they were already accepted)
    await Notification.deleteOne({ 
      toUserId: session.id, 
      fromUserId: requesterId, 
      type: 'follow_request' 
    });

    const requestIndex = me.followRequests.findIndex((r) => r.userId.toString() === requesterId);
    if (requestIndex === -1) {
      return NextResponse.json({ ok: true, msg: 'Request already processed.' });
    }

    const requester = me.followRequests[requestIndex];
    me.followRequests.splice(requestIndex, 1);
    await me.save();
    
    await User.findByIdAndUpdate(session.id, { $addToSet: { followers: requesterId } });
    await User.findByIdAndUpdate(requesterId, { $addToSet: { following: session.id } });



    Notification.create({
      toUserId:    requesterId,
      fromUserId:  session.id,
      fromUsername:session.username,
      type:        'follow_accepted',
    }).catch((e) => console.error('[follow_accepted notification]', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[follow request accept]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// Reject a follow request
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { requesterId } = await params;

    await User.findByIdAndUpdate(session.id, {
      $pull: { followRequests: { userId: requesterId } },
    });

    // Remove the original follow_request notification
    await Notification.deleteOne({ 
      toUserId: session.id, 
      fromUserId: requesterId, 
      type: 'follow_request' 
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[follow request reject]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
