const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");

async function seedAdminUser() {
  const existingAdminCount = await AdminUser.countDocuments();
  if (existingAdminCount > 0) {
    return;
  }

  const username = String(process.env.ADMIN_SEED_USERNAME || "").trim();
  const password = String(process.env.ADMIN_SEED_PASSWORD || "");
  const displayName = String(process.env.ADMIN_SEED_DISPLAY_NAME || username || "Platform Admin").trim();

  if (!username || !password) {
    console.warn("No initial admin seed credentials provided. Skipping admin seeding.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await AdminUser.create({
    username,
    passwordHash,
    displayName,
    isActive: true,
  });
}

module.exports = { seedAdminUser };
