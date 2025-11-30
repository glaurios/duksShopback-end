import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Drink from "../models/drinks.js";
import axios from "axios";
import crypto from "crypto";

/** 🟢 Generate unique Paystack reference */
const generatePaystackReference = () => {
return `PSK-${crypto.randomBytes(8).toString("hex")}-${Date.now()}`;
};

/** 🟢 Create Order from Cart (Checkout) */
export const createOrderFromCheckout = async (req, res) => {
try {
const userId = req.user._id;

```
const cartItems = await Cart.find({ userId }).populate("drinkId");
if (!cartItems.length) return res.status(400).json({ message: "Cart is empty" });

let totalAmount = 0;
const items = cartItems.map((item) => {
  // Pick the first active pack price, fallback to 0
  const packPrice = item.drinkId.packs.find(p => p.price) || { price: 0 };
  totalAmount += packPrice.price * item.quantity;

  return {
    drinkId: item.drinkId._id,
    name: item.drinkId.name,
    price: packPrice.price,
    quantity: item.quantity,
    pack: packPrice.pack || null,
  };
});

const paystackReference = generatePaystackReference();

const newOrder = await Order.create({
  userId,
  items,
  totalAmount,
  paymentStatus: "pending",
  orderStatus: "pending",
  paystackReference,
});

await Cart.deleteMany({ userId });

res.status(201).json({
  message: "Order created. Proceed to payment.",
  order: newOrder,
  paystackReference,
});
```

} catch (err) {
console.error(err);
res.status(500).json({ message: "Failed to create order" });
}
};

/** 🟢 Get Orders for Logged-in User (frontend-friendly) */
export const getUserOrders = async (req, res) => {
try {
const userId = req.user._id;
const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

```
const formattedOrders = await Promise.all(
  orders.map(async order => {
    const items = await Promise.all(order.items.map(async item => {
      const drink = await Drink.findById(item.drinkId);
      return {
        id: item.drinkId.toString(),
        name: item.name,
        image: drink?.imageUrl ? `${process.env.BASE_URL || "http://localhost:5000"}/${drink.imageUrl}` : "",
        price: item.price,
        qty: item.quantity,
        pack: item.pack || drink?.packs?.[0]?.pack || null,
      };
    }));

    let status = "Pending";
    switch(order.orderStatus){
      case "confirmed":
      case "ready": status = "Processing"; break;
      case "picked_up": status = "Delivered"; break;
      case "cancelled": status = "Cancelled"; break;
    }

    return {
      id: order._id.toString(),
      date: order.createdAt.toISOString(),
      status,
      total: order.totalAmount,
      items,
      pickupLocation: order.pickupLocation,
      paystackReference: order.paystackReference,
    };
  })
);

res.json(formattedOrders);
```

} catch (err) {
console.error(err);
res.status(500).json({ message: "Failed to fetch user orders" });
}
};

/** 🟢 Get Single Order by ID */
export const getOrderById = async (req, res) => {
try {
const { id } = req.params;
const order = await Order.findById(id).lean();
if (!order) return res.status(404).json({ message: "Order not found" });

```
const items = await Promise.all(order.items.map(async item => {
  const drink = await Drink.findById(item.drinkId);
  return {
    id: item.drinkId.toString(),
    name: item.name,
    image: drink?.imageUrl ? `${process.env.BASE_URL || "http://localhost:5000"}/${drink.imageUrl}` : "",
    price: item.price,
    qty: item.quantity,
    pack: item.pack || drink?.packs?.[0]?.pack || null,
  };
}));

let status = "Pending";
switch(order.orderStatus){
  case "confirmed":
  case "ready": status = "Processing"; break;
  case "picked_up": status = "Delivered"; break;
  case "cancelled": status = "Cancelled"; break;
}

res.json({
  id: order._id.toString(),
  date: order.createdAt.toISOString(),
  status,
  total: order.totalAmount,
  items,
  pickupLocation: order.pickupLocation,
  paystackReference: order.paystackReference,
});
```

} catch (err) {
console.error(err);
res.status(500).json({ message: "Failed to fetch order" });
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

/** 🟢 Update Order Status (Admin) */
export const updateOrderStatus = async (req, res) => {
try {
const { id } = req.params;
const { orderStatus } = req.body;

```
const order = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true });
if (!order) return res.status(404).json({ message: "Order not found" });

res.json({ message: "Order status updated", order });
```

} catch (err) {
console.error(err);
res.status(500).json({ message: "Failed to update order status" });
}
};

/** 🟢 Cancel Order (User) */
export const cancelOrder = async (req, res) => {
try {
const { id } = req.params;
const order = await Order.findByIdAndUpdate(id, { orderStatus: "cancelled", paymentStatus: "refunded" }, { new: true });
if (!order) return res.status(404).json({ message: "Order not found" });

```
res.json({ message: "Order cancelled successfully", order });
```

} catch (err) {
console.error(err);
res.status(500).json({ message: "Failed to cancel order" });
}
};

/** 🟢 Verify Paystack Payment */
export const verifyPayment = async (req, res) => {
try {
const { reference } = req.body;

```
const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
});

const data = response.data.data;

if(data.status !== "success") return res.status(400).json({ message: "Payment failed" });

const order = await Order.findOne({ paystackReference: reference });
if(!order) return res.status(404).json({ message: "Order not found" });

order.paymentStatus = "paid";
order.orderStatus = "confirmed";
await order.save();

res.json({ message: "Payment verified & order updated", order });
```

} catch(err) {
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

```
res.json({ totalOrders, totalRevenue });
```

} catch(err) {
console.error(err);
res.status(500).json({ message: "Failed to fetch dashboard stats" });
}
};
