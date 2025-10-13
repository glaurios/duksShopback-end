// src/models/refreshToken.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './user.js';

export const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tokenHash: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
});

RefreshToken.belongsTo(User);
User.hasMany(RefreshToken);
