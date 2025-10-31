import Drink from "../models/drinks.js";

/**
 * ===============================
 * 🟢 GET ALL DRINKS (Public)
 * ===============================
 */
export const getAllDrinks = async (req, res) => {
  try {
    const drinks = await Drink.find();
    res.status(200).json({
      success: true,
      count: drinks.length,
      drinks,
    });
  } catch (error) {
    console.error("❌ Error fetching drinks:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching drinks",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 🟢 GET ONE DRINK BY ID (Public)
 * ===============================
 */
export const getDrinkById = async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) {
      return res.status(404).json({ success: false, message: "Drink not found" });
    }
    res.status(200).json({ success: true, drink });
  } catch (error) {
    console.error("❌ Error fetching drink:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching drink",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 🔒 ADD NEW DRINK (Admin only)
 * ===============================
 */
export const addDrink = async (req, res) => {
  try {
    const { name, description, category, size, status, packs } = req.body;

    // ✅ FIXED: Validate name and packs instead of price
    if (!name || !packs) {
      return res.status(400).json({
        success: false,
        message: "Name and at least one pack are required",
      });
    }

    // 🖼️ Handle Cloudinary image upload
    let imageUrl = "";
    if (req.file) {
      if (req.file.path) imageUrl = req.file.path;
      else if (req.file.url) imageUrl = req.file.url;
    }

    // 🧩 Parse packs safely
    let parsedPacks = [];
    if (packs) {
      try {
        parsedPacks = typeof packs === "string" ? JSON.parse(packs) : packs;
      } catch (parseErr) {
        console.error("⚠️ Error parsing packs JSON:", parseErr);
        return res.status(400).json({
          success: false,
          message: "Invalid packs format",
        });
      }
    }

    // ✅ Additional validation: ensure packs array has at least one item with pack and price
    if (!Array.isArray(parsedPacks) || parsedPacks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one pack with pack size and price is required",
      });
    }

    // Validate each pack has required fields
    for (const pack of parsedPacks) {
      if (!pack.pack || !pack.price) {
        return res.status(400).json({
          success: false,
          message: "Each pack must have both pack size and price",
        });
      }
    }

    // ✅ FIX: Convert status to lowercase to match enum values
    const drinkStatus = status ? status.toLowerCase() : "active";

    const newDrink = new Drink({
      name,
      description: description || "",
      category: category || "",
      size: size || "",
      status: drinkStatus, // ✅ Now uses lowercase status
      available: true,
      imageUrl,
      packs: parsedPacks,
    });

    const savedDrink = await newDrink.save();

    res.status(201).json({
      success: true,
      message: "✅ Drink added successfully",
      drink: savedDrink,
    });
  } catch (error) {
    console.error("❌ Error adding drink:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding drink",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 🔒 UPDATE A DRINK (Admin only)
 * ===============================
 */
export const updateDrink = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = { ...req.body };

    // ✅ FIX: Convert status to lowercase if it exists
    if (updates.status) {
      updates.status = updates.status.toLowerCase();
    }

    // 🖼️ Handle new image (Cloudinary)
    if (req.file) {
      if (req.file.path) updates.imageUrl = req.file.path;
      else if (req.file.url) updates.imageUrl = req.file.url;
    }

    // 🧩 Parse packs JSON if sent as string
    if (updates.packs && typeof updates.packs === "string") {
      try {
        updates.packs = JSON.parse(updates.packs);
      } catch (parseErr) {
        console.error("⚠️ Error parsing packs JSON:", parseErr);
      }
    }

    const updatedDrink = await Drink.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedDrink) {
      return res.status(404).json({ success: false, message: "Drink not found" });
    }

    res.status(200).json({
      success: true,
      message: "✅ Drink updated successfully",
      drink: updatedDrink,
    });
  } catch (error) {
    console.error("❌ Error updating drink:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating drink",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * 🔒 DELETE A DRINK (Admin only)
 * ===============================
 */
export const deleteDrink = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDrink = await Drink.findByIdAndDelete(id);

    if (!deletedDrink) {
      return res.status(404).json({ success: false, message: "Drink not found" });
    }

    res.status(200).json({
      success: true,
      message: "✅ Drink deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting drink:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting drink",
      error: error.message,
    });
  }
};