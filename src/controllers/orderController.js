import Order from "../models/order.js";
import Drink from "../models/drinks.js";
import mongoose from "mongoose";
import kowriService from "../services/kowriServices.js";

/**
 * ===============================
 * 🛒 CREATE ORDER FROM CHECKOUT
 * ===============================
 */
export const createOrderFromCheckout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      // Customer Info
      fullName,
      email,
      phone,
      city,
      address,
      
      // Delivery Details
      deliveryDate,
      deliveryTime,
      
      // Order Type & Payment
      orderType = "delivery",
      paymentMethod,
      
      // Cart Items
      items,
      
      // Additional info
      specialInstructions,
      userId,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !city || !address || !paymentMethod || !items) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // Calculate order totals and validate items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const drink = await Drink.findById(item.drinkId).session(session);
      if (!drink) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Drink "${item.drinkName}" not found`,
        });
      }

      const selectedPack = drink.packs.find(p => p.pack === item.pack);
      if (!selectedPack) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Pack size ${item.pack}ml not available for ${drink.name}`,
        });
      }

      const itemTotal = selectedPack.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        drink: drink._id,
        drinkName: drink.name,
        pack: item.pack,
        price: selectedPack.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    // Calculate delivery fee
    const deliveryFee = orderType === "delivery" ? (subtotal > 1000 ? 0 : 200) : 0;
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + deliveryFee + tax;

    // Set delivery time
    let estimatedDelivery = new Date();
    if (deliveryDate && deliveryTime) {
      const [time, modifier] = deliveryTime.split(' ');
      let [hours, minutes, seconds] = time.split(':');
      
      if (modifier === 'PM' && hours !== '12') {
        hours = parseInt(hours) + 12;
      }
      if (modifier === 'AM' && hours === '12') {
        hours = '00';
      }

      const deliveryDateTime = new Date(deliveryDate);
      deliveryDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      estimatedDelivery = deliveryDateTime;
    } else {
      estimatedDelivery.setHours(estimatedDelivery.getHours() + 1);
    }

    // Create order
    const newOrder = new Order({
      user: userId || null,
      userName: fullName,
      userEmail: email,
      userPhone: phone,
      deliveryAddress: {
        street: address,
        city: city,
        state: "Accra",
        zipCode: "00233",
        instructions: specialInstructions || "",
      },
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      paymentMethod: paymentMethod === "pay-on-delivery" ? "cash" : paymentMethod,
      paymentStatus: paymentMethod === "pay-on-delivery" ? "pending" : "pending",
      specialInstructions: specialInstructions || "",
      orderType,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      deliveryTime,
      estimatedDelivery,
    });

    const savedOrder = await newOrder.save({ session });

    // Handle payment based on selected method
    if (paymentMethod === "card" || paymentMethod === "mobile-money") {
      const paymentData = {
        orderId: savedOrder._id.toString(),
        orderNumber: savedOrder.orderNumber,
        amount: totalAmount,
        customerEmail: email,
        customerName: fullName,
        customerPhone: phone,
        description: `Order #${savedOrder.orderNumber} - Fresh Drinks Shop`,
        items: orderItems.map(item => ({
          name: `${item.drinkName} (${item.pack}ml)`,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const paymentInit = await kowriService.initializePayment(paymentData);

      if (!paymentInit.success) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Payment initialization failed: ${paymentInit.error}`,
        });
      }

      savedOrder.paymentDetails = {
        transactionId: paymentInit.paymentReference,
        paymentGateway: "kowri",
        paymentUrl: paymentInit.paymentUrl,
      };
      
      await savedOrder.save({ session });
      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        message: "✅ Order created successfully. Redirecting to payment...",
        order: savedOrder,
        payment: {
          paymentUrl: paymentInit.paymentUrl,
          checkoutUrl: paymentInit.checkoutUrl,
          reference: paymentInit.paymentReference,
          requiresPayment: true,
        },
      });

    } else {
      // Pay on Delivery
      await session.commitTransaction();
      
      return res.status(201).json({
        success: true,
        message: "✅ Order placed successfully! You'll pay when your order arrives.",
        order: savedOrder,
        payment: {
          requiresPayment: false,
        },
      });
    }

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/**
 * ===============================
 * 📋 GET ALL ORDERS (Admin)
 * ===============================
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    let filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 👤 GET USER ORDERS
 * ===============================
 */
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("items.drink", "name imageUrl");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user orders",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 📦 GET ORDER BY ID
 * ===============================
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.drink", "name imageUrl category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching order",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 🔄 UPDATE ORDER STATUS (Admin)
 * ===============================
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const validStatuses = ["pending", "confirmed", "preparing", "out-for-delivery", "delivered", "cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const updateData = { status };
    
    if (status === "delivered") {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = "paid";
    } else if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = cancellationReason || "";
      updateData.paymentStatus = "failed";
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `✅ Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating order status",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 💰 VERIFY PAYMENT
 * ===============================
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, reference } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const verification = await kowriService.verifyPayment(reference);
    
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.error,
      });
    }

    const paymentStatus = verification.status;
    
    let orderUpdate = {};
    if (paymentStatus === 'success') {
      orderUpdate = {
        paymentStatus: "paid",
        status: "confirmed",
        "paymentDetails.paidAt": new Date(),
      };
    } else if (paymentStatus === 'failed') {
      orderUpdate = {
        paymentStatus: "failed",
        status: "failed",
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      orderUpdate,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Payment ${paymentStatus}`,
      paymentStatus,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying payment",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * ❌ CANCEL ORDER (User)
 * ===============================
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason, userId } = req.body;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user && order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    const cancelledOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: cancellationReason || "Cancelled by user",
        paymentStatus: "failed",
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "✅ Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling order",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 📊 GET ORDER STATS (Admin Dashboard)
 * ===============================
 */
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const confirmedOrders = await Order.countDocuments({ status: "confirmed" });
    const preparingOrders = await Order.countDocuments({ status: "preparing" });
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });
    
    const revenueResult = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysOrders = await Order.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        preparingOrders,
        deliveredOrders,
        todaysOrders,
        totalRevenue: revenue,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching order stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching order stats",
      error: error.message,
    });
  }
};