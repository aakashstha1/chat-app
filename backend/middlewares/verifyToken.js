import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.chat_token;

  if (!token) throw new AppError("Unauthorized - No token provided", 403);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.userId = decoded?.userId;
    next();
  } catch (error) {
    next(new AppError("Unauthorized - Invalid token", 403));
  }
};
