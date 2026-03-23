const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");

async function seedAdminUser() {
  const existingAdmin = await AdminUser.findOne({ username: "Dev" });
  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash("Dev@2580", 10);
  await AdminUser.create({
    username: "Dev",
    passwordHash,
    displayName: "Dev",
    isActive: true,
  });
}

module.exports = { seedAdminUser };
