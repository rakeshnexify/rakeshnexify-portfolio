import rateLimit from "express-rate-limit";

const appointmentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many consultation requests were received. Please wait a few minutes and try again.",
  },
});

export default appointmentRateLimiter;