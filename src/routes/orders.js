import express from "express";
import {
  createOrderFromCheckout,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  verifyPayment,
  cancelOrder,
  getOrderStats,
} from "../controllers/orderController.js";

const router = express.Router();

// Public routes
router.post("/checkout", createOrderFromCheckout);
router.get("/user/:userId", getUserOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);
router.post("/verify-payment", verifyPayment);

// Admin routes
router.get("/", getAllOrders);
router.get("/stats/dashboard", getOrderStats);
router.patch("/:id/status", updateOrderStatus);

export default router;