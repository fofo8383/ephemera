import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    await dbConnect();
    
    // Fetch user and populate followers/following to get their username, avatarUrl, and bio
    const target = await User.findOne({ username })
      .populate('followers', 'username avatarUrl bio')
      .populate('following', 'username avatarUrl bio')
      .lean();
      
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    
    // Sort so newest are likely later (we can reverse it on the client if needed)
    return NextResponse.json({ 
      followers: target.followers || [], 
      following: target.following || [] 
    });
  } catch (err) {
    console.error('[connections GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
