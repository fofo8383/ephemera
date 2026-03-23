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
    expires: 86400, // TTL: MongoDB auto-deletes after 24 hours
  },
});

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
