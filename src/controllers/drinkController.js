import Drink from "../models/drinks.js";

// 🟢 Get all drinks (Public)
export const getAllDrinks = async (req, res) => {
  try {
    const drinks = await Drink.findAll();
    res.status(200).json(drinks);
  } catch (err) {
    console.error("❌ Error fetching drinks:", err);
    res.status(500).json({ message: "Server error while fetching drinks" });
  }
};

// 🟢 Get one drink by ID (Public)
export const getDrinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const drink = await Drink.findByPk(id);

    if (!drink) {
      return res.status(404).json({ message: "Drink not found" });
    }

    res.status(200).json(drink);
  } catch (err) {
    console.error("❌ Error fetching drink:", err);
    res.status(500).json({ message: "Server error while fetching drink" });
  }
};

// 🔒 Add new drink (Admin only)
export const addDrink = async (req, res) => {
  try {
    const { name, description, price, category, size, status } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    // ✅ Cloudinary provides `req.file.path` as the full URL
    const imageUrl = req.file ? req.file.path : null;

    const newDrink = await Drink.create({
      name,
      description,
      price,
      category,
      size,
      status: status || "Active",
      imageUrl,
      available: true,
    });

    res.status(201).json({
      message: "Drink added successfully",
      drink: newDrink,
    });
  } catch (err) {
    console.error("❌ Error adding drink:", err);
    res.status(500).json({ message: "Server error while adding drink" });
  }
};

// 🔒 Update a drink (Admin only)
export const updateDrink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, size, status, available } = req.body;

    const drink = await Drink.findByPk(id);
    if (!drink) {
      return res.status(404).json({ message: "Drink not found" });
    }

    // ✅ If new image uploaded, replace with new Cloudinary URL
    const imageUrl = req.file ? req.file.path : drink.imageUrl;

    await drink.update({
      name,
      description,
      price,
      category,
      size,
      status,
      available,
      imageUrl,
    });

    res.status(200).json({
      message: "Drink updated successfully",
      drink,
    });
  } catch (err) {
    console.error("❌ Error updating drink:", err);
    res.status(500).json({ message: "Server error while updating drink" });
  }
};

// 🔒 Delete a drink (Admin only)
export const deleteDrink = async (req, res) => {
  try {
    const { id } = req.params;
    const drink = await Drink.findByPk(id);

    if (!drink) {
      return res.status(404).json({ message: "Drink not found" });
    }

    await drink.destroy();

    res.status(200).json({ message: "Drink deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting drink:", err);
    res.status(500).json({ message: "Server error while deleting drink" });
  }
};
