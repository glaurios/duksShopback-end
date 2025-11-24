import Order from "../models/order.js";
import crypto from "crypto";

/**
 * ===============================
 * 📩 KWORI PAYMENT WEBHOOK
 * ===============================
 */
export const kowriWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-kowri-signature"];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.KOWRI_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Invalid webhook signature");
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const { event, data } = req.body;

    if (event === "payment.success") {
      const { reference, order_id } = data;

      const order = await Order.findById(order_id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      await Order.findByIdAndUpdate(order_id, {
        paymentStatus: "paid",
        status: "confirmed",
        "paymentDetails.paidAt": new Date(),
        "paymentDetails.transactionId": reference,
      });

      console.log(`✅ Payment successful for order ${order.orderNumber}`);
      
      // Here you can send emails, notifications, etc.

    } else if (event === "payment.failed") {
      const { reference, order_id } = data;

      await Order.findByIdAndUpdate(order_id, {
        paymentStatus: "failed",
        status: "failed",
      });

      console.log(`❌ Payment failed for order ${order_id}`);
    }

    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};