// src/controllers/authController.js
import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import { RefreshToken } from '../models/refreshToken.js';
import { signAccessToken, signRefreshToken, hashToken } from '../utils/tokens.js';

export async function signup(req, res) {
  const { username, email, password } = req.body;
  // validate input (Joi etc) - omitted for brevity
  const existing = await User.findOne({ where: { email }});
  if (existing) return res.status(400).json({ message: 'Email already used' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash });

  // create tokens
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  // store hashed refresh in DB
  const hashed = await hashToken(refreshToken);
  await RefreshToken.create({ tokenHash: hashed, UserId: user.id, expiresAt: new Date(Date.now() + 7*24*3600*1000) });

  // set HttpOnly cookie
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7*24*3600*1000 });
  res.json({ accessToken, user: { id: user.id, username: user.username, email: user.email }});
}
