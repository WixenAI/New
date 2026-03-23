const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");
const { JWT_SECRET } = require("../middleware/requireAuth");

function createToken(admin) {
  return jwt.sign(
    {
      sub: admin._id.toString(),
      username: admin.username,
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

async function login(req, res) {
  const { username, password } = req.body;
  const admin = await AdminUser.findOne({ username: String(username || "").trim() });

  if (!admin || !admin.isActive) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  const isValid = await bcrypt.compare(String(password || ""), admin.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  return res.json({
    token: createToken(admin),
    admin: {
      id: admin._id,
      username: admin.username,
      displayName: admin.displayName,
    },
  });
}

async function me(req, res) {
  return res.json({
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      displayName: req.admin.displayName,
    },
  });
}

function logout(req, res) {
  return res.json({ message: "Logged out." });
}

module.exports = { login, me, logout };
