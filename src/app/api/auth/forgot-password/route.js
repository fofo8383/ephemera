import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `ephemera. <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your ephemera. password',
      html: `
        <p>Hi @${user.username},</p>
        <p>Click the link below to reset your password. It expires in 1 hour.</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
