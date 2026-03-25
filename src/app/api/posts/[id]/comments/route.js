import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
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
    const isOwnPost  = post.userId.toString() === session.id;

    // ── Notify post owner (skip if commenting on own post) ────
    if (!isOwnPost) {
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

    // ── Handle @mentions ──────────────────────────────────────
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const rawMentions  = [...newComment.text.matchAll(mentionRegex)].map((m) => m[1]);
    const uniqueMentions = [...new Set(rawMentions)];

    if (uniqueMentions.length > 0) {
      // Fetch both the commenter's and the uploader's following lists
      const [commenter, uploader] = await Promise.all([
        User.findById(session.id).select('following').lean(),
        User.findById(post.userId).select('following').lean(),
      ]);
      const commenterFollowing = new Set(commenter.following.map((id) => id.toString()));
      const uploaderFollowing  = new Set(uploader.following.map((id) => id.toString()));

      const mentionedUsers = await User.find({
        username: { $in: uniqueMentions },
        _id: { $ne: session.id }, // never notify yourself
      }).select('_id username').lean();

      for (const u of mentionedUsers) {
        const uid = u._id.toString();
        const isPostOwner = uid === post.userId.toString();

        // Valid mention: the post uploader, OR someone both the commenter
        // AND the uploader follow (they're in both networks)
        const inBothNetworks = commenterFollowing.has(uid) && uploaderFollowing.has(uid);
        if (!isPostOwner && !inBothNetworks) continue;

        // Post owner already gets a comment notification — skip duplicate
        if (isPostOwner && !isOwnPost) continue;

        Notification.create({
          toUserId:    u._id,
          fromUserId:  session.id,
          fromUsername:session.username,
          type:        'mention',
          postId:      post._id,
          postImageUrl:post.imageUrl,
          commentText: newComment.text,
        }).catch((e) => console.error('[mention notification]', e));
      }
    }

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (err) {
    console.error('[comments POST]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
