// src/models/cart.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./user.js";
import Drink from "../models/drinks.js";

const Cart = sequelize.define("Cart", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

// Relationships
User.hasMany(Cart, { foreignKey: "userId", onDelete: "CASCADE" });
Cart.belongsTo(User, { foreignKey: "userId" });

Drink.hasMany(Cart, { foreignKey: "drinkId", onDelete: "CASCADE" });
Cart.belongsTo(Drink, { foreignKey: "drinkId" });

export default Cart;
