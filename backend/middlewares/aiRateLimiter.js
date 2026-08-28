import { AppError } from "../utils/AppError.js";

// Basic in-memory, per-user sliding-window limiter for the AI endpoint
// specifically (normal messaging is untouched). This intentionally
// avoids a new dependency for a single route.
//
// Note: this state lives in process memory, so it resets on restart
// and is NOT shared across multiple server instances. If you deploy
// more than one instance behind a load balancer, swap the Map below
// for a Redis-backed counter (e.g. via `rate-limit-redis`) without
// changing the middleware's public shape.
const WINDOW_MS = parseInt(process.env.AI_RATE_LIMIT_WINDOW) || 60000;
const MAX_REQUESTS = parseInt(process.env.AI_RATE_LIMIT) || 20;

// userId -> array of request timestamps within the current window
const requestLog = new Map();

export const aiRateLimiter = (req, res, next) => {
  const userId = req.userId;

  if (!userId) {
    return next(new AppError("Unauthorized", 401));
  }

  const now = Date.now();
  const timestamps = (requestLog.get(userId) || []).filter(
    (t) => now - t < WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS) {
    return next(
      new AppError(
        "Too many messages sent to the AI assistant. Please slow down.",
        429,
      ),
    );
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);

  next();
};
