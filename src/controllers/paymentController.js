import axios from "axios";
import crypto from "crypto";
import Order from "../models/order.js";
import Cart from "../models/cart.js";

export const initializePayment = async (req, res) => {
  try {
    const { email } = req.user;
    const cartItems = await Cart.find({ userId: req.user._id }).populate("drinkId");

    if (!cartItems.length) return res.status(400).json({ message: "Cart is empty" });

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

    const amount = total * 100;

    const paystackData = {
      email,
      amount,
      currency: "GHS",
      callback_url: `${process.env.BACKEND_URL}/api/orders/verify`, 
      metadata: {
        userId: req.user._id,
        items,
      },
    };

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

    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error("Payment init error:", error.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
};

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
    if (data.status !== "success")
      return res.status(400).json({ message: "Payment failed" });

    const { userId, items } = data.metadata;
    const totalAmount = data.amount / 100;

    const order = await Order.findOne({ paystackReference: reference });

    if (!order) {
      await Order.create({
        userId,
        items,
        totalAmount,
        paystackReference: reference,
        paymentStatus: "paid",
        orderStatus: "confirmed",
      });
    }

    await Cart.deleteMany({ userId });

    return res.redirect(`${process.env.FRONTEND_URL}/orders`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

export const webhookPayment = async (req, res) => {
  try {
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Server error");
  }
};
