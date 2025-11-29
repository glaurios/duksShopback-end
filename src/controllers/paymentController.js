import axios from "axios";
import mongoose from "mongoose";
import crypto from "crypto";
import Order from "../models/order.js";
import Cart from "../models/cart.js";
import drinks from "../models/drinks.js"; // make sure the model name matches your file

// =====================
// Initialize Paystack Payment
// =====================
export const initializePayment = async (req, res) => {
  try {
    const { email } = req.user;
    const { paymentMethod, phone } = req.body; // paymentMethod: "card" or "mobile_money"

    const cartItems = await Cart.find({ userId: req.user._id }).populate("drinkId");
    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    const items = cartItems.map((item) => {
      const price = item.drinkId.packs[0]?.price || 0;
      total += price * item.quantity;
      return {
        drinkId: item.drinkId._id,
        name: item.drinkId.name,
        price,
        quantity: item.quantity,
      };
    });

    const amount = total * 100; // GHS → pesewas

    const paystackData = {
      email,
      amount,
      currency: "GHS",
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        items,
        userId: req.user._id,
      },
    };

    if (paymentMethod === "mobile_money") {
      paystackData.mobile_money = {
        phone: phone || "0551234987",
        provider: "mtn",
      };
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paystackData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error("Payment init error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Payment initialization failed" });
  }
};

// =====================
// Verify Paystack Payment (Manual)
// =====================
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    if (data.status !== "success") {
      return res.status(400).json({ message: "Payment failed" });
    }

    const { userId, items } = data.metadata;
    const totalAmount = data.amount / 100; // convert back to GHS

    const newOrder = await Order.create({
      userId,
      items,
      totalAmount,
      paystackReference: reference,
      paymentStatus: "paid",
      orderStatus: "confirmed",
    });

    await Cart.deleteMany({ userId });

    return res.json({
      message: "Payment verified & order created",
      order: newOrder,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: "Payment verification failed" });
  }
};

// =====================
// Paystack Webhook (Step 2) — Robust
// =====================
export const webhookPayment = async (req, res) => {
  try {
    const event = req.body;

    // ✅ Verify signature in production
    if (process.env.NODE_ENV === "production") {
      const signature = req.headers["x-paystack-signature"];
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== signature) {
        console.warn("⚠️ Invalid Paystack webhook signature");
        return res.status(400).send("Invalid signature");
      }
    } else {
      // ✅ Dev mode: skip signature check for Postman testing
      console.log("ℹ️ Webhook received (dev mode, skipping signature check)");
    }

    // ✅ Handle charge.success event
    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const amount = event.data.amount / 100; // pesewas → GHS
      const metadata = event.data.metadata || {};
      const userId = metadata.userId;

      // Try to find existing order (if created during manual verify)
      let order = await Order.findOne({ paystackReference: reference });

      if (!order && userId && metadata.items) {
        // If order doesn't exist, create it from metadata
        order = await Order.create({
          userId,
          items: metadata.items,
          totalAmount: amount,
          paystackReference: reference,
          paymentStatus: "paid",
          orderStatus: "confirmed",
        });
      } else if (order) {
        // Update existing order
        order.paymentStatus = "paid";
        order.orderStatus = "confirmed";
        order.totalAmount = amount;
        await order.save();
      }

      // Clear user's cart if userId exists
      if (userId) await Cart.deleteMany({ userId });
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Server error");
  }
};

// =====================
// Step 3: Get All Orders for a User
// =====================
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId, paymentStatus: "paid" }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch user orders" });
  }
};

// =====================
// Step 4: Get Single Order by ID (Optional)
// =====================
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};
