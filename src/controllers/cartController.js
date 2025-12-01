import Cart from "../models/cart.js";
import Drink from "../models/drinks.js";

export const addToCart = async (req, res) => {
try {
let { drinkId, quantity, pack } = req.body;
const userId = req.user._id;

```
quantity = Number(quantity) || 1;
pack = Number(pack);

const drink = await Drink.findById(drinkId);
if (!drink) return res.status(404).json({ message: "Drink not found" });

if (!Array.isArray(drink.packs) || drink.packs.length === 0) {
  return res.status(400).json({ message: "Drink has no packs available" });
}

let existingItem = await Cart.findOne({ userId, drinkId, pack });

if (existingItem) {
  existingItem.quantity += quantity;
  await existingItem.save();
  return res.json({ message: "Cart updated", cartItem: existingItem });
}

const cartItem = await Cart.create({
  userId,
  drinkId,
  pack,
  quantity,
});

res.status(201).json({ message: "Added to cart", cartItem });
```

} catch (err) {
console.error("❌ Add to cart error:", err);
res.status(500).json({ message: "Server error", error: err.message });
}
};

export const getCartItems = async (req, res) => {
try {
const userId = req.user._id;

```
const items = await Cart.find({ userId }).populate("drinkId");

const result = items.map((item) => {
  const drink = item.drinkId;

  if (!drink) return null;

  const selectedPack = drink.packs?.find((p) => p.pack === item.pack);

  return {
    id: item._id,
    drinkId: drink._id,
    name: drink.name,
    price: selectedPack?.price || 0,
    qty: item.quantity,
    packs: drink.packs || [],
    pack: item.pack,
    image: drink?.imageUrl || "",
  };
}).filter(Boolean);

res.json({ cartItems: result });
```

} catch (err) {
console.error("❌ Get cart items error:", err);
res.status(500).json({ message: "Server error", error: err.message });
}
};

export const removeFromCart = async (req, res) => {
try {
const { id } = req.params;
const userId = req.user._id;

```
const item = await Cart.findOneAndDelete({ _id: id, userId });
if (!item) return res.status(404).json({ message: "Cart item not found" });

res.json({ message: "Item removed from cart" });
```

} catch (err) {
console.error("❌ Remove from cart error:", err);
res.status(500).json({ message: "Server error", error: err.message });
}
};
