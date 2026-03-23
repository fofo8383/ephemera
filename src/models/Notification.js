import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  toUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUsername:{ type: String, required: true },
  type:        { type: String, enum: ['follow', 'comment', 'follow_request', 'follow_accepted'], required: true },
  postId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  postImageUrl:{ type: String },
  commentText: { type: String },
  read:        { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now, expires: 30 * 86400 }, // 30-day TTL
});

// Don't create duplicate follow notifications
NotificationSchema.index({ toUserId: 1, fromUserId: 1, type: 1 }, { unique: false });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
