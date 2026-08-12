import rateLimit from "express-rate-limit";

const subscriberRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many newsletter subscription requests were received. Please wait a few minutes and try again.",
  },
});

export default subscriberRateLimiter;
