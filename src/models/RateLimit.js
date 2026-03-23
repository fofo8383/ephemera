import mongoose from 'mongoose';

const RateLimitSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  action: { type: String, required: true },
  count: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 900 } // TTL index: auto-deletes after 900s (15 mins)
});

// Enforce unique limits per IP and action combination
RateLimitSchema.index({ ip: 1, action: 1 }, { unique: true });

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
