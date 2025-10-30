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
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    available: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    // 🟢 NEW: Support multiple packs with individual prices
    packs: [packSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Drink", drinkSchema);
