import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

export async function PATCH() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    await Notification.updateMany({ toUserId: session.id, read: false }, { read: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notifications PATCH]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
