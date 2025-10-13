// src/utils/tokens.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_EXPIRES || '15m' });
}
export function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: process.env.REFRESH_EXPIRES || '7d' });
}
export async function hashToken(token) {
  return bcrypt.hash(token, 10); // store hashed refresh tokens
}
export async function compareToken(hash, token) {
  return bcrypt.compare(token, hash);
}
export function verifyToken(token, isRefresh = false) {
  const secret = isRefresh ? process.env.REFRESH_SECRET : process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}