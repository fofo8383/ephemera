import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

// Follow a user
export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { username } = await params;
    const target = await User.findOne({ username });
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (target._id.toString() === session.id) {
      return NextResponse.json({ error: 'You cannot follow yourself.' }, { status: 400 });
    }

    await User.findByIdAndUpdate(session.id, { $addToSet: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $addToSet: { followers: session.id } });

    Notification.create({
      toUserId:    target._id,
      fromUserId:  session.id,
      fromUsername:session.username,
      type:        'follow',
    }).catch((e) => console.error('[follow notification]', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[follow POST]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// Unfollow a user
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { username } = await params;
    const target = await User.findOne({ username });
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    await User.findByIdAndUpdate(session.id, { $pull: { following: target._id } });
    await User.findByIdAndUpdate(target._id, { $pull: { followers: session.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[follow DELETE]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
