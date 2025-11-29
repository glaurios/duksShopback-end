import Order from "../models/order.js";
import Cart from "../models/cart.js";
import axios from "axios";

/** 🟢 Create Order from Cart (Checkout) */
export const createOrderFromCheckout = async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's cart items
    const cartItems = await Cart.find({ userId }).populate("drinkId");
    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    const items = cartItems.map((item) => {
      const price = item.drinkId.packs[0]?.price || 0;
      totalAmount += price * item.quantity;
      return {
        drinkId: item.drinkId._id,
        name: item.drinkId.name,
        price,
        quantity: item.quantity,
      };
    });

    // Create order in DB as "pending"
    const newOrder = await Order.create({
      userId,
      items,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    // Clear cart after creating order
    await Cart.deleteMany({ userId });

    res.status(201).json({
      message: "Order created. Proceed to payment.",
      order: newOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

/** 🟢 Get All Orders (Admin) */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/** 🟢 Get Orders for a User */
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
};

/** 🟢 Get Single Order by ID */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

/** 🟢 Update Order Status (Admin) */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

/** 🟢 Cancel Order (User) */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus: "cancelled", paymentStatus: "refunded" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

/** 🟢 Verify Paystack Payment */
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;

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
    const totalAmount = data.amount / 100;

    // Create order in DB after successful payment
    const newOrder = await Order.create({
      userId,
      items,
      totalAmount,
      paystackReference: reference,
      paymentStatus: "paid",
      orderStatus: "confirmed",
    });

    res.json({
      message: "Payment verified & order created",
      order: newOrder,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

/** 🟢 Get Order Stats (Admin Dashboard) */
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenueAgg = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;

    res.json({
      totalOrders,
      totalRevenue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};