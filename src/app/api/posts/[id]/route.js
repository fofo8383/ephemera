import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { deleteImage } from '@/lib/cloudinary';

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    if (post.userId.toString() !== session.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (post.imagePublicId) await deleteImage(post.imagePublicId);
    await post.deleteOne();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[posts DELETE]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
