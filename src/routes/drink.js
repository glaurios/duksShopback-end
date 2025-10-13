import express from "express";
import {
  getAllDrinks,
  getDrinkById,
  addDrink,
  updateDrink,
  deleteDrink,
} from "../controllers/drinkController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/**
 * ==========================
 * 🟢 PUBLIC ROUTES
 * ==========================
 */

// ✅ Get all drinks (anyone can access)
router.get("/", getAllDrinks);

// ✅ Get single drink by ID
router.get("/:id", getDrinkById);

/**
 * ==========================
 * 🔒 ADMIN ROUTES
 * ==========================
 *
 * These routes require:
 * - A valid token (verifyToken)
 * - Admin privileges (isAdmin)
 * - Optionally, image upload via Multer
 */

// ✅ Add a new drink (with optional image upload)
router.post(
  "/add",
  verifyToken,
  isAdmin,
  upload.single("image"),
  addDrink
);

// ✅ Update a drink (image can also be updated)
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  updateDrink
);

// ✅ Delete a drink by ID
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  deleteDrink
);

export default router;
