import express from "express";
import { signup, login, logout, refresh, getMe } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // ✅ updated import

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", authMiddleware, getMe); // ✅ use authMiddleware instead of verifyToken

export default router;
