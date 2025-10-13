import Cart from "../models/cart.js";
import Drink from "../models/drinks.js";

// ✅ Add drink to cart
export const addToCart = async (req, res) => {
  try {
    const { drinkId, quantity } = req.body;
    const userId = req.user.id;

    const drink = await Drink.findByPk(drinkId);
    if (!drink) {
      return res.status(404).json({ message: "Drink not found" });
    }

    // Check if item already in cart
    const existingItem = await Cart.findOne({ where: { userId, drinkId } });
    if (existingItem) {
      existingItem.quantity += quantity || 1;
      await existingItem.save();
      return res.json({ message: "Cart updated", cartItem: existingItem });
    }

    const cartItem = await Cart.create({
      userId,
      drinkId,
      quantity: quantity || 1,
    });

    res.status(201).json({ message: "Added to cart", cartItem });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all cart items for a user
export const getCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Drink }],
    });

    res.json({ cartItems });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params; // cart item id
    const userId = req.user.id;

    const item = await Cart.findOne({ where: { id, userId } });

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await item.destroy();
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ message: "Server error" });
  }
};
