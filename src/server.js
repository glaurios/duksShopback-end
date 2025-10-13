import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "./config/db.js";
import authRoutes from "./routes/auth.js";
import drinkRoutes from "./routes/drink.js";
import cartRoutes from "./routes/cart.js";
import User from "./models/user.js";
import Drink from "./models/drinks.js"; // ✅ make sure model name matches file
import fs from "fs";

dotenv.config();

const app = express();

// ✅ Fix dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 'uploads' folder created automatically");
}

// ✅ CORS for frontend connections (adjust if needed)
app.use(cors({
  origin: "*",
  credentials: true,
}));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static folder for images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Request logger
app.use((req, res, next) => {
  console.log(`🟢 ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/drinks", drinkRoutes); // includes admin image upload route
app.use("/api/cart", cartRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Drink Shop Backend Running 🚀");
});

// ✅ Database connection & sync
sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .then(() => sequelize.sync({ alter: true }))
  .then(() => console.log("✅ All models synchronized successfully"))
  .catch((err) => console.log("❌ Error connecting to the database:", err));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
