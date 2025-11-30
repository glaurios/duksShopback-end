import express from "express";
import {
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  createOrderFromCheckout,
} from "../controllers/orderController.js";

import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, isAdmin, getAllOrders);
router.get("/my-orders", authMiddleware, getUserOrders);
router.get("/:id", authMiddleware, getOrderById);
router.put("/:id", authMiddleware, isAdmin, updateOrderStatus);
router.put("/cancel/:id", authMiddleware, cancelOrder);

// 📌 Paystack Success Callback Route
router.post("/paystack/callback", authMiddleware, createOrderFromCheckout);

// 📌 Stats
router.get("/stats", authMiddleware, isAdmin, getOrderStats);

export default router;
