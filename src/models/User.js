import mongoose from 'mongoose';
import crypto from 'crypto';

const FollowRequestSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  createdAt:{ type: Date, default: Date.now },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String },
  googleId:     { type: String, unique: true, sparse: true },
  bio: { type: String, maxlength: 160, default: '' },
  avatarUrl: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Invite code — unique 8-char hex, generated once at signup
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Pending inbound follow requests
  followRequests: [FollowRequestSchema],

  // Who has used this user's invite code (userId list) — for "follow back" suggestions
  inviteCodeUsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  passwordResetToken:  { type: String },
  passwordResetExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Generate an invite code before saving if missing
UserSchema.pre('save', function () {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex'); // 8-char hex e.g. "a1b2c3d4"
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
