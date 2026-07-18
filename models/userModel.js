const db = require("../config/db");

exports.createUser = (username, email, password, callback) => {
  db.run(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password],
    callback,
  );
};

exports.findUserByEmail = (email, callback) => {
  db.get("SELECT * FROM users WHERE email = ?", [email], callback);
};
