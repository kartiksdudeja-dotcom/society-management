import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized", error: err.message });
  }
};

export const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      // user's role is not authorized
      return res.status(403).json({ message: 'Forbidden - You are not authorized to access this route' });
    }

    // authentication and authorization successful
    next();
  };
};

