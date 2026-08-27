import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getIO } from "../socket/socket.js";
import { kindFromMime } from "../utils/multer.js";
import { AppError } from "../utils/AppError.js";

const areFriends = async (userId, otherId) => {
  const user = await User.findById(userId).select("friends");
  return user?.friends?.some((f) => f.toString() === otherId);
};

// GET /api/messages/:friendId?page=&limit=
export const getMessagesService = async (friendId, page, limit, userId) => {
  const friends = await areFriends(userId, friendId);
  if (!friends) throw new AppError("You are not friends with this user", 403);

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 30, 1), 100);

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  return {
    messages,
    page: pageNum,
    limit: limitNum,
  };
};

// POST /api/messages/:friendId  (multipart/form-data: text, files[])
export const sendMessageService = async (friendId, text, files, userId) => {
  if (!text.trim() && files.length === 0)
    throw new AppError("Message is empty", 400);

  const friends = await areFriends(userId, friendId);
  if (!friends) throw new AppError("You are not friends with this user", 403);

  const attachments = files.map((f) => ({
    url: `/uploads/${f.filename}`,
    name: f.originalname,
    mimeType: f.mimetype,
    kind: kindFromMime(f.mimetype),
    size: f.size,
  }));

  const message = await Message.create({
    sender: userId,
    receiver: friendId,
    text: text.trim(),
    attachments,
  });

  getIO().to(friendId).emit("newMessage", message);
  getIO().to(userId).emit("newMessage", message);

  return message;
};
