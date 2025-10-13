import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

// =======================================================
// 🔐 Helper: Generate Tokens
// =======================================================
const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id, isAdmin: user.isAdmin },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { token, refreshToken };
};

// =======================================================
// 🧩 Helper: Fixed Admin Check
// =======================================================
const isFixedAdmin = (email, password) => {
  const admins = [
    { email: process.env.ADMIN_EMAIL_1, password: process.env.ADMIN_PASSWORD_1 },
    { email: process.env.ADMIN_EMAIL_2, password: process.env.ADMIN_PASSWORD_2 },
    { email: process.env.ADMIN_EMAIL_3, password: process.env.ADMIN_PASSWORD_3 },
  ];

  return admins.find(
    (admin) =>
      admin.email &&
      admin.password &&
      email.trim().toLowerCase() === admin.email.toLowerCase() &&
      password === admin.password
  );
};

// =======================================================
// 🧾 SIGNUP Controller
// =======================================================
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
      isAdmin: false,
    });

    const { token, refreshToken } = generateTokens(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      refreshToken,
      role: "user",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================================================
// 🔑 LOGIN Controller
// =======================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🧩 Check fixed admin credentials
    const matchedAdmin = isFixedAdmin(email, password);

    if (matchedAdmin) {
      let admin = await User.findOne({ where: { email: matchedAdmin.email } });

      if (!admin) {
        const hashedPassword = await bcrypt.hash(password, 10);
        admin = await User.create({
          username: matchedAdmin.email.split("@")[0],
          email: matchedAdmin.email,
          passwordHash: hashedPassword,
          isAdmin: true,
        });
      } else if (!admin.isAdmin) {
        admin.isAdmin = true;
        await admin.save();
      }

      const { token, refreshToken } = generateTokens(admin);

      return res.status(200).json({
        message: "Admin logged in successfully",
        token,
        refreshToken,
        role: "admin",
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      });
    }

    // ✅ Regular user login
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { token, refreshToken } = generateTokens(user);

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      role: user.isAdmin ? "admin" : "user",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================================================
// 🚪 LOGOUT Controller
// =======================================================
export const logout = async (req, res) => {
  try {
    res.json({ message: "Logout successful — remove token on client side" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// =======================================================
// 🔁 REFRESH TOKEN Controller
// =======================================================
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
      }

      const newAccessToken = jwt.sign(
        { id: decoded.id, isAdmin: decoded.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Access token refreshed successfully",
        token: newAccessToken,
      });
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================================================
// 👤 GET CURRENT USER Controller
// =======================================================
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: user.isAdmin ? "Logged in as Admin" : "Logged in as User",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
