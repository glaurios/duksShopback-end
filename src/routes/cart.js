import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js"; // ✅ updated import
import { addToCart, getCartItems, removeFromCart } from "../controllers/cartController.js";

const router = express.Router();

// 🔒 User must be logged in
router.post("/", authMiddleware, addToCart);
router.get("/", authMiddleware, getCartItems);
router.delete("/:id", authMiddleware, removeFromCart);

export default router;
