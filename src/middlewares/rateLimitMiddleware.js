import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 86400 }); // 1 day TTL

export const rateLimit = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.subscriptionTier === 'pro') {
      return next();                           // unlimited for pro users
    }

    // check cache
    const key = `msg_count:${userId}`;
    const currentCount = cache.get(key) || 0;

    if (currentCount >= 10) {
      return res.status(429).json({
        success: false,
        error: "Daily message limit reached for Basic plan. Upgrade to Pro for unlimited usage."
      });
    }

    // increment count
    cache.set(key, currentCount + 1);
    next();

  } catch (err) {
    console.error("Rate limit error:", err);
    return res.status(500).json({ success: false, error: "Rate limit check failed" });
  }
};
