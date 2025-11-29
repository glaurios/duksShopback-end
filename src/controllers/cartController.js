import Cart from "../models/cart.js"
import Drink from "../models/drinks.js"

export const addToCart = async (req, res) => {
try {
const { drinkId, quantity } = req.body
const userId = req.user.id

const drink = await Drink.findById(drinkId)
if (!drink) return res.status(404).json({ message: "Drink not found" })

let existingItem = await Cart.findOne({ userId, drinkId })

if (existingItem) {
  existingItem.quantity = existingItem.quantity + (quantity || 1)
  await existingItem.save()
  return res.json({ message: "Cart updated", cartItem: existingItem })
}

const cartItem = await Cart.create({
  userId,
  drinkId,
  quantity: quantity || 1
})

res.status(201).json({ message: "Added to cart", cartItem })


} catch (err) {
res.status(500).json({ message: "Server error" })
}
}

export const getCartItems = async (req, res) => {
try {
const userId = req.user.id

const items = await Cart.find({ userId }).populate("drinkId")

const result = items.map(item => {
  const drink = item.drinkId

  return {
    id: item._id,
    drinkId: drink._id,
    name: drink.name,
    price: drink.price,
    image: drink.image,
    qty: item.quantity,
    pack: drink.pack,
    packs: drink.packs
  }
})

res.json({ cartItems: result })


} catch (err) {
res.status(500).json({ message: "Server error" })
}
}

export const removeFromCart = async (req, res) => {
try {
const { id } = req.params
const userId = req.user.id

const item = await Cart.findOneAndDelete({ _id: id, userId })
if (!item) return res.status(404).json({ message: "Cart item not found" })

res.json({ message: "Item removed from cart" })


} catch (err) {
res.status(500).json({ message: "Server error" })
}
}
