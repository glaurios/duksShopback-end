import express from "express";
import {
  initializePayment,
  verifyPayment,
  webhookPayment,
  getUserOrders,
  getOrderById,
} from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Authenticated routes
router.post("/initialize", authMiddleware, initializePayment);
router.get("/verify/:reference", authMiddleware, verifyPayment);
router.get("/user/:userId", authMiddleware, getUserOrders);
router.get("/view/:orderId", authMiddleware, getOrderById);

// Webhook route (no auth required)
router.post("/webhook", express.json({ type: "*/*" }), webhookPayment);

export default router;
