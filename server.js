// Load env vars FIRST before any other requires
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { authLimiter, apiLimiter } = require("./middleware/rateLimiter");


const app = express();


// CSP disabled: modern browsers ignore 'unsafe-inline' without nonces,
// which blocks all inline scripts in our static HTML pages.
// Other helmet headers (X-Frame-Options, HSTS, etc.) are still active.
app.use(helmet({
  contentSecurityPolicy: false,
}));


app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));


app.use(express.static("public"));


// Strict rate limit on auth
app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);

// General rate limit on AI
app.use("/api/ai", apiLimiter);
app.use("/api/ai", aiRoutes);


app.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});


app.use((err, req, res, next) => {
  console.error("[server] unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✓ Vixy-AI server running on http://localhost:${PORT}`));
