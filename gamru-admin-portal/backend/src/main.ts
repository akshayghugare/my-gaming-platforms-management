import dns from "dns";
// Render's outbound network has no IPv6 route. Node otherwise resolves hosts
// (e.g. smtp.gmail.com) to an IPv6 address first and SMTP fails with
// ENETUNREACH. Prefer IPv4 for all outbound DNS lookups to avoid this.
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import sequelize from "./config/db";

// Import all models so Sequelize registers them
import "./modules/user/model/user.model";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected via Sequelize");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
    process.exit(1);
  }
};

startServer();
