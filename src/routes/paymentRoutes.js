import express from "express";
import { kowriWebhook } from "../controllers/paymentController.js";

const router = express.Router();

// Kowri webhook (no auth needed)
router.post("/kowri/webhook", kowriWebhook);

export default router;