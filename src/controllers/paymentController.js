import Order from "../models/order.js";

/**
 * ===============================
 * 📩 KOWRI PAYMENT WEBHOOK (No signature check)
 * ===============================
 */
export const kowriWebhook = async (req, res) => {
  try {
    const { status, transactionId, invoiceNum, customerReference } = req.body;

    console.log("Webhook received:", req.body);

    if (status === "FULFILLED") {
      // Payment successful
      const order = await Order.findById(customerReference); // assuming customerReference = order_id
      if (order) {
        await Order.findByIdAndUpdate(customerReference, {
          paymentStatus: "paid",
          status: "confirmed",
          "paymentDetails.paidAt": new Date(),
          "paymentDetails.transactionId": transactionId,
        });
        console.log(`✅ Payment successful for order ${order.orderNumber}`);
      } else {
        console.warn(`⚠️ Order not found for ID: ${customerReference}`);
      }

    } else if (status === "UNFULFILLED_ERROR") {
      // Payment failed
      const order = await Order.findById(customerReference);
      if (order) {
        await Order.findByIdAndUpdate(customerReference, {
          paymentStatus: "failed",
          status: "failed",
        });
        console.log(`❌ Payment failed for order ${customerReference}`);
      }
    }

    // Always respond 200 OK so Kowri does not retry
    res.sendStatus(200);

  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.sendStatus(500);
  }
};
