import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Drink = sequelize.define("Drink", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // Product name
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // Short product description
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Price per unit
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  // Optional image URL
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // Product category (Juice, Smoothie, etc.)
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // Product size (Small, 300ml, 500ml, etc.)
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // Whether it's visible or hidden in store
  status: {
    type: DataTypes.ENUM("Active", "Inactive"),
    defaultValue: "Active",
  },

  // Availability toggle for admin use
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default Drink;
