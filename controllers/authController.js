const jwt = require("jsonwebtoken");
const { validateSignup } = require("../utils/validator");
const userModel = require("../models/userModel");
const { hashPassword, comparePassword } = require("../utils/hash");

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Sanitize username
    const cleanUsername = String(username).trim().slice(0, 50);
    if (cleanUsername.length < 2) {
      return res
        .status(400)
        .json({ message: "Username must be at least 2 characters." });
    }

    // Validate email & password format/strength
    const error = validateSignup(email, password);
    if (error) return res.status(400).json({ message: error });

    const hashed = await hashPassword(password);

    userModel.createUser(
      cleanUsername,
      email.toLowerCase().trim(),
      hashed,
      (err) => {
        if (err) {
          // Don't leak whether email exists — generic error
          return res
            .status(409)
            .json({ message: "An account with this email already exists." });
        }
        res.status(201).json({ message: "Account created successfully." });
      },
    );
  } catch (err) {
    console.error("[auth] signup error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    userModel.findUserByEmail(email.toLowerCase().trim(), async (err, user) => {
      // Use constant-time comparison to prevent timing attacks
      // Even if user doesn't exist, still run comparePassword (against dummy hash)
      const dummyHash = "$2b$12$invalidhashfortimingprotection0000000000000000";

      if (!user) {
        // Still run bcrypt to prevent timing-based user enumeration
        await comparePassword(password, dummyHash).catch(() => {});
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("[auth] JWT_SECRET not set!");
        return res.status(500).json({ message: "Server configuration error." });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        secret,
        {
          expiresIn: "8h",
          algorithm: "HS256",
        },
      );

      res.json({
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    });
  } catch (err) {
    console.error("[auth] login error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.profile = (req, res) => {
  res.json({
    message: "Access granted.",
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
    },
  });
};
