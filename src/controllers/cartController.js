import Cart from "../models/cart.js"
import Drink from "../models/drinks.js"

export const addToCart = async (req, res) => {
  try {
    const { drinkId, quantity, pack } = req.body;
    const userId = req.user._id;

    const drink = await Drink.findById(drinkId);
    if (!drink) return res.status(404).json({ message: "Drink not found" });

    // CHECK SAME DRINK + SAME PACK
    let existingItem = await Cart.findOne({ userId, drinkId, pack });

    if (existingItem) {
      existingItem.quantity += quantity || 1;
      await existingItem.save();
      return res.json({ message: "Cart updated", cartItem: existingItem });
    }

    const cartItem = await Cart.create({
      userId,
      drinkId,
      pack,
      quantity: quantity || 1
    });

    res.status(201).json({ message: "Added to cart", cartItem });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getCartItems = async (req, res) => {
  try {
    const userId = req.user._id;


    const items = await Cart.find({ userId }).populate("drinkId");

    const result = items.map(item => {
      const drink = item.drinkId;

      // find the correct pack the user selected
      const selectedPack = drink.packs.find(p => p.pack === item.pack);

      return {
        id: item._id,
        drinkId: drink._id,
        name: drink.name,

        // CORRECT PRICE
        price: selectedPack ? selectedPack.price : 0,

        qty: item.quantity,

        // RETURN ALL PACKS SO USER CAN SEE OPTIONS
        packs: drink.packs,

        // USER-SELECTED PACK (REAL VALUE)
        pack: item.pack,

        // IMAGE
        image: drink?.imageUrl || "",
      };
    });

    res.json({ cartItems: result });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const removeFromCart = async (req, res) => {
try {
const { id } = req.params
const userId = req.user._id;

const item = await Cart.findOneAndDelete({ _id: id, userId })
if (!item) return res.status(404).json({ message: "Cart item not found" })

res.json({ message: "Item removed from cart" })


} catch (err) {
res.status(500).json({ message: "Server error" })
}
}
