import User from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";

const publicUser = (user) => {
  const { password, verificationToken, resetPasswordToken, ...rest } =
    user._doc || user;
  return rest;
};

// -------------------------------------------------- Create User ------------------------------------------
export const createUser = async (userData) => {
  const { username, email, password, name } = userData;

  const [existingEmail, existingUsername] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username }),
  ]);

  if (existingEmail) throw new AppError("Email is already in use", 400);

  if (existingUsername) throw new AppError("Username is already in use", 400);

  const hashedPassword = await bcryptjs.hash(password, 10);
  const verificationToken = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  const user = new User({
    username,
    email,
    password: hashedPassword,
    name,
    provider: "local",
    verificationToken,
    verificationTokenExpiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  await user.save();
  return publicUser(user);
};

// -------------------------------------------------- Get User ------------------------------------------
export const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  return publicUser(user);
};
