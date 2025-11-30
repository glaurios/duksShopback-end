import Order from "../models/order.js";
import Cart from "../models/cart.js";

// 📌 Get all orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// 📌 Get logged-in user's paid orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
      paymentStatus: "paid",
    }).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
};

// 📌 Get a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// 📌 Admin — Update Order Status
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
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// 📌 Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus: "cancelled", paymentStatus: "refunded" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order cancelled", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

// 📌 Stats for Admin Dashboard
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenueAgg = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;

    res.json({ totalOrders, totalRevenue });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// 📌 Paystack Payment Callback: Create Order + Clear Cart
export const createOrderFromCheckout = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: "Missing payment reference" });
    }

    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Cart is empty" });
    }

    const newOrder = new Order({
      userId,
      items: cart.items,
      totalAmount: cart.totalPrice,
      paymentStatus: "paid",
      orderStatus: "completed",
      paymentReference: reference,
    });

    await newOrder.save();

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });

  } catch (error) {
    console.error("❌ Error processing payment callback:", error);
    res.status(500).json({ message: "Error processing order" });
  }
};
