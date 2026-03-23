import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

    const { text } = await request.json();
    if (!text || !text.trim()) return NextResponse.json({ error: 'Comment text required.' }, { status: 400 });

    post.comments.push({
      userId:   session.id,
      username: session.username,
      text:     text.trim().slice(0, 300),
    });
    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    // Notify post owner (skip if commenting on your own post)
    if (post.userId.toString() !== session.id) {
      Notification.create({
        toUserId:    post.userId,
        fromUserId:  session.id,
        fromUsername:session.username,
        type:        'comment',
        postId:      post._id,
        postImageUrl:post.imageUrl,
        commentText: newComment.text,
      }).catch((e) => console.error('[comment notification]', e));
    }

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (err) {
    console.error('[comments POST]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
