import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Check if the logged-in user is an admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    req.user = decoded; // store user info for later use
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
