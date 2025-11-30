// src/models/refreshToken.js
import mongoose from "mongoose";
import User from "./user.js"; // fixed default import


export const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tokenHash: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
});

RefreshToken.belongsTo(User);
User.hasMany(RefreshToken);
