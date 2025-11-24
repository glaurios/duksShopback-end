import express from "express";
import { createPayment, kowriWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// Payment initiation
router.post("/create-payment", createPayment);

// Kowri webhook (no secret)
router.post("/kowri/webhook", kowriWebhook);

export default router;
