import dbConnect from './mongodb';
import RateLimit from '@/models/RateLimit';

export async function checkRateLimit(ip, action = 'auth', maxLimit = 5) {
  // Fail-closed: if IP can't be resolved, block the request.
  if (!ip || ip === 'unknown') return false;

  await dbConnect();
  
  const record = await RateLimit.findOneAndUpdate(
    { ip, action },
    { $inc: { count: 1 }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return record.count <= maxLimit;
}
