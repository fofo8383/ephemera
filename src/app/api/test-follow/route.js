import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Code required.' }, { status: 400 });

    await dbConnect();
    const target = await User.findOne({ username: 'rhjt' });
    if (!target) return NextResponse.json({ error: 'User rhjt not found.' }, { status: 404 });

    // Create a fake second user to follow them
    let fake = await User.findOne({ username: 'marta_k' });
    if (!fake) {
      fake = await User.create({
        username: 'marta_k',
        email: 'marta.k@ephemera.local',
        passwordHash: 'xx',
        bio: 'from the demo.',
        inviteCode: 'marta123'
      });
    }

    const alreadyRequested = target.followRequests?.some((r) => r.userId.toString() === fake._id.toString());
    if (alreadyRequested) {
      return NextResponse.json({ error: 'Already requested.' }, { status: 400 });
    }

    await User.findByIdAndUpdate(target._id, {
      $push: { followRequests: { userId: fake._id, username: fake.username, createdAt: new Date() } },
      $addToSet: { inviteCodeUsedBy: fake._id },
    });

    await Notification.create({
      toUserId: target._id,
      fromUserId: fake._id,
      fromUsername: fake.username,
      type: 'follow_request',
    });

    return NextResponse.json({ ok: true, msg: 'Follow request from marta.k sent successfully!' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
