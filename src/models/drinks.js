import mongoose from "mongoose";

const packSchema = new mongoose.Schema({
  pack: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const drinkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"], // ✅ lowercase & consistent
      default: "active",
    },
    available: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    packs: [packSchema], // ✅ supports multiple pack options
  },
  { timestamps: true }
);

export default mongoose.model("Drink", drinkSchema);
