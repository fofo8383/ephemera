import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import { getSession, clearTokenCookie } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();

    // Delete all the user's posts + their Cloudinary images
    const posts = await Post.find({ userId: session.id });
    await Promise.all(
      posts.map((p) => p.imagePublicId ? deleteImage(p.imagePublicId) : Promise.resolve())
    );
    await Post.deleteMany({ userId: session.id });

    // Remove this user from other users' followers/following lists
    await User.updateMany(
      { $or: [{ followers: session.id }, { following: session.id }] },
      { $pull: { followers: session.id, following: session.id } }
    );

    // Delete the user
    await User.findByIdAndDelete(session.id);

    const res = NextResponse.json({ ok: true });
    clearTokenCookie(res);
    return res;
  } catch (err) {
    console.error('[delete account]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
