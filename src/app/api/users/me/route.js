import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    let user = await User.findById(session.id)
      .select('-passwordHash -passwordResetToken -passwordResetExpiry')
      .lean();
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // Back-fill invite code for existing users
    if (!user.inviteCode) {
      const code = crypto.randomBytes(4).toString('hex');
      await User.findByIdAndUpdate(session.id, { inviteCode: code });
      user.inviteCode = code;
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[me GET]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { username, bio } = await request.json();

    const updates = {};
    if (username !== undefined) {
      if (!/^[a-zA-Z0-9_]{2,30}$/.test(username)) {
        return NextResponse.json({ error: 'Invalid username format.' }, { status: 400 });
      }
      const taken = await User.findOne({ username, _id: { $ne: session.id } });
      if (taken) return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
      updates.username = username;
    }
    if (bio !== undefined) updates.bio = bio.slice(0, 160);

    const updated = await User.findByIdAndUpdate(session.id, updates, { new: true })
      .select('-passwordHash -passwordResetToken -passwordResetExpiry');

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('[me PATCH]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
