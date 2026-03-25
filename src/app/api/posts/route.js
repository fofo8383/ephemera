import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import sharp from 'sharp';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();

    // Enforce one post per day
    const dayAgo = new Date(Date.now() - 86400 * 1000);
    const existing = await Post.findOne({ userId: session.id, createdAt: { $gte: dayAgo } });
    if (existing) {
      return NextResponse.json(
        { error: "You've already posted today. Come back tomorrow!" },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');
    const caption = formData.get('caption') || '';

    if (!file) return NextResponse.json({ error: 'Image is required.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP and HEIC images are allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const raw = Buffer.from(bytes);

    const processed = await sharp(raw)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const { url, publicId } = await uploadImage(processed);

    const post = await Post.create({
      userId: session.id,
      username: session.username,
      imageUrl: url,
      imagePublicId: publicId,
      caption: caption.slice(0, 100),
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error('[posts POST]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
