import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        drinkId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Drink",
          required: true
        },
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    orderStatus: {
      type: String,
      enum: ["confirmed", "ready", "picked_up", "cancelled"],
      default: "confirmed"
    },

    pickupLocation: {
      type: String,
      default: "Main Store"
    },

    paystackReference: {
      type: String,
      required: true, // Unique reference from Paystack
      unique: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
