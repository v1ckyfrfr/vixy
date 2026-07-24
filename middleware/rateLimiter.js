const rateLimit = require("express-rate-limit");
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again in 15 minutes.",
  },
  skipSuccessfulRequests: false,
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Rate limit exceeded. Please slow down.",
  },
});

module.exports = { authLimiter, apiLimiter };
