import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";

dotenv.config();

/** ✅ Verify JWT Token Middleware */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided, authorization denied" });
    }

    // 🟢 Extract token
    const token = authHeader.split(" ")[1];

    // 🟢 Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🟢 Use decoded.id to find user (MongoDB uses _id)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🟢 Attach user to request for next middleware
    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/** ✅ Check if logged-in user is an Admin */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - no user found" });
    }

    // ✅ List of admin emails (from .env)
    const adminEmails = [
      process.env.ADMIN_EMAIL_1,
      process.env.ADMIN_EMAIL_2,
      process.env.ADMIN_EMAIL_3,
    ].filter(Boolean);

    // ✅ Check if user is admin either in DB or .env
    const isAdminUser = req.user.isAdmin === true || adminEmails.includes(req.user.email);

    if (!isAdminUser) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    req.user.isAdmin = true;
    next();
  } catch (err) {
    console.error("❌ Admin verification failed:", err);
    res.status(500).json({ message: "Server error while checking admin status" });
  }
};
