import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";

dotenv.config();

/** 🔐 Auth Middleware — Validate Access Token */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided. Authorization denied." });
    }

    const token = authHeader.split(" ")[1];

    // ✅ FIXED: Your login token uses "id", not "userId"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/** 👑 Admin-Only Access Middleware */
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Your DB stores isAdmin, not role
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    console.error("❌ Admin check failed:", err.message);
    res.status(500).json({ message: "Server error checking admin status" });
  }
};
