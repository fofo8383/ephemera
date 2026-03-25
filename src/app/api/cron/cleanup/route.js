import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Notification from '@/models/Notification';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cron not configured.' }, { status: 500 });
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
  }

  await dbConnect();

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
  const expired = await Post.find({ createdAt: { $lte: cutoff } }).lean();

  let deleted = 0;
  let failed = 0;

  for (const post of expired) {
    try {
      if (post.imagePublicId) await deleteImage(post.imagePublicId);
      await Notification.deleteMany({ postId: post._id, type: { $in: ['comment', 'mention'] } });
      await Post.deleteOne({ _id: post._id });
      deleted++;
    } catch (err) {
      console.error('[cron/cleanup] failed to delete post', post._id, err.message);
      failed++;
    }
  }

  console.log(`[cron/cleanup] deleted ${deleted}, failed ${failed}`);
  return NextResponse.json({ ok: true, deleted, failed });
}
