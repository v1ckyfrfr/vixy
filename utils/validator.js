const validator = require("validator");

exports.validateSignup = (email, password) => {
  // Validate email format
  if (!validator.isEmail(String(email))) {
    return "Please enter a valid email address.";
  }

  // Password strength requirements
  const pw = String(password);

  if (pw.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (pw.length > 128) {
    return "Password must not exceed 128 characters.";
  }

  // Require at least one letter and one number
  if (!/[a-zA-Z]/.test(pw)) {
    return "Password must contain at least one letter.";
  }

  if (!/[0-9]/.test(pw)) {
    return "Password must contain at least one number.";
  }

  return null;
};
