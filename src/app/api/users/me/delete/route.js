import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import Notification from '@/models/Notification';
import { getSession, clearTokenCookie } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();

    const me = await User.findById(session.id).select('avatarPublicId').lean();

    // Delete Cloudinary avatar
    if (me?.avatarPublicId) {
      await deleteImage(me.avatarPublicId).catch((e) => console.error('[delete avatar]', e));
    }

    // Delete all the user's posts + their Cloudinary images
    const posts = await Post.find({ userId: session.id });
    await Promise.all(
      posts.map((p) => p.imagePublicId ? deleteImage(p.imagePublicId) : Promise.resolve())
    );
    await Post.deleteMany({ userId: session.id });

    // Remove this user's comments from other people's posts
    await Post.updateMany(
      { 'comments.userId': session.id },
      { $pull: { comments: { userId: session.id } } }
    );

    // Delete all notifications sent to or from this user
    await Notification.deleteMany({
      $or: [{ toUserId: session.id }, { fromUserId: session.id }],
    });

    // Remove from other users' followers/following/followRequests lists
    await User.updateMany(
      {
        $or: [
          { followers: session.id },
          { following: session.id },
          { followRequests: session.id },
          { inviteCodeUsedBy: session.id },
        ],
      },
      {
        $pull: {
          followers: session.id,
          following: session.id,
          followRequests: session.id,
          inviteCodeUsedBy: session.id,
        },
      }
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
