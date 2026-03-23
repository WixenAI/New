const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "broker-platform-dev-secret";

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const admin = await AdminUser.findById(payload.sub).select("username displayName isActive");

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Admin account is inactive." });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}

module.exports = { requireAuth, JWT_SECRET };
