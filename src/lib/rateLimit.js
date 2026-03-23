import dbConnect from './mongodb';
import RateLimit from '@/models/RateLimit';

export async function checkRateLimit(ip, action = 'auth', maxLimit = 5) {
  // If IP can't be resolved, let it pass to not block legitimate users blindly, 
  // though in production Vercel always provides x-forwarded-for.
  if (!ip || ip === 'unknown') return true;

  await dbConnect();
  
  const record = await RateLimit.findOneAndUpdate(
    { ip, action },
    { $inc: { count: 1 }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return record.count <= maxLimit;
}
