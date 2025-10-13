import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { addToCart, getCartItems, removeFromCart } from "../controllers/cartController.js";

const router = express.Router();

// 🔒 User must be logged in
router.post("/", verifyToken, addToCart);
router.get("/", verifyToken, getCartItems);
router.delete("/:id", verifyToken, removeFromCart);

export default router;
