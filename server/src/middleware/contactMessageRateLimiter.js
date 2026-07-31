import { rateLimit } from "express-rate-limit";

const FIFTEEN_MINUTES_IN_MILLISECONDS = 15 * 60 * 1000;

const contactMessageRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_IN_MILLISECONDS,

  limit: 5,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,

    message:
      "Too many project enquiries were submitted from this connection. Please wait 15 minutes and try again.",
  },
});

export default contactMessageRateLimiter;
