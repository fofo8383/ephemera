import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(request) {
  // Vercel cron jobs send Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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
