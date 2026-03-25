import { NextResponse } from 'next/server';
import sharp from 'sharp';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('avatar');
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP and HEIC images are allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const raw = Buffer.from(bytes);

    // Resize to 400x400, cover crop, JPEG 80%
    const processed = await sharp(raw)
      .resize(400, 400, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 80 })
      .toBuffer();

    await dbConnect();
    const user = await User.findById(session.id).select('avatarPublicId');

    // Delete old avatar from Cloudinary if it exists
    if (user?.avatarPublicId) await deleteImage(user.avatarPublicId);

    const { url, publicId } = await uploadImage(processed, 'ephemera/avatars');

    const updated = await User.findByIdAndUpdate(
      session.id,
      { avatarUrl: url, avatarPublicId: publicId },
      { new: true }
    ).select('avatarUrl');

    return NextResponse.json({ avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error('[avatar POST]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
