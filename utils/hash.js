const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12; // Increased from 10 for better security

exports.hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
exports.comparePassword = (password, hash) => bcrypt.compare(password, hash);
