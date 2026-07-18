const rateLimit = require("express-rate-limit");

// Strict limiter for auth endpoints (login/signup)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again in 15 minutes.",
  },
  skipSuccessfulRequests: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Rate limit exceeded. Please slow down.",
  },
});

module.exports = { authLimiter, apiLimiter };
