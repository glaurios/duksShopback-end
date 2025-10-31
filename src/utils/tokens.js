// src/utils/tokens.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

/**
 * ✅ Create an Access Token
 * - Includes user id and isAdmin flag
 * - Defaults to 15m unless overridden by .env
 */
export function signAccessToken(user) {
  const payload = {
    id: user._id || user.id,
    isAdmin: user.isAdmin || false,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRES || "15m",
  });
}

/**
 * ✅ Create a Refresh Token
 * - Also includes isAdmin to preserve user role on refresh
 */
export function signRefreshToken(user) {
  const payload = {
    id: user._id || user.id,
    isAdmin: user.isAdmin || false,
  };

  return jwt.sign(payload, process.env.REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRES || "7d",
  });
}

/**
 * ✅ Hash token for secure storage (optional)
 */
export async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

/**
 * ✅ Compare token hashes
 */
export async function compareToken(hash, token) {
  return bcrypt.compare(token, hash);
}

/**
 * ✅ Verify Access or Refresh Token
 * - Returns decoded payload (id + isAdmin)
 */
export function verifyToken(token, isRefresh = false) {
  const secret = isRefresh
    ? process.env.REFRESH_SECRET
    : process.env.JWT_SECRET;

  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
