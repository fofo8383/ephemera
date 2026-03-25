import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  text: { type: String, required: true, maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String }, // Cloudinary public ID for deletion
  caption: { type: String, maxlength: 100, default: '' },
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 90000, // TTL: safety net at 25h — cron handles deletion at 24h
  },
});

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
