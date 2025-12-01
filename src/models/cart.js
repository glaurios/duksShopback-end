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
      required: true,
      default: 1,
    }
  },
  { timestamps: true }
);

// ✅ Ensure uniqueness per drink + pack for each user
cartSchema.index({ userId: 1, drinkId: 1, pack: 1 }, { unique: true });

export default mongoose.model("Cart", cartSchema);
