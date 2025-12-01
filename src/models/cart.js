import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drink",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    pack: {
      type: Number,
      required: true,   // because frontend always sends it
      default: 1,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
