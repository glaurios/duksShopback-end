import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },

  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // ✅ Added field for role-based access (admin / user)
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Normal users by default
  },

  // ✅ Optional: you can track when a user last logged in
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default User;
