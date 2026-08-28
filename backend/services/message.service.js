import Message from "../models/message.model.js";
import User from "../models/user.model.js";

import { getIO } from "../socket/socket.js";
import { kindFromMime } from "../utils/multer.js";
import { AppError } from "../utils/AppError.js";
import {
  findConversation,
  getOrCreateConversation,
} from "./conversation.service.js";

const areFriends = async (userId, otherId) => {
  const user = await User.findById(userId).select("friends");

  return user?.friends?.some((f) => f.toString() === otherId.toString());
};



// GET /api/messages/:friendId?page=&limit=
export const getMessagesService = async (friendId, page, limit, userId) => {
  const friends = await areFriends(userId, friendId);

  if (!friends) {
    throw new AppError("You are not friends with this user", 403);
  }

  const pageNum = Math.max(parseInt(page) || 1, 1);

  const limitNum = Math.min(Math.max(parseInt(limit) || 30, 1), 100);

  const conversation = await findConversation(userId, friendId);

  if (!conversation) {
    return {
      messages: [],
      page: pageNum,
      limit: limitNum,
    };
  }

  const messages = await Message.find({
    conversationId: conversation._id,
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

// POST /api/messages/:friendId
export const sendMessageService = async (friendId, text, files, userId) => {
  if (!text.trim() && files.length === 0) {
    throw new AppError("Message is empty", 400);
  }

  const friends = await areFriends(userId, friendId);

  if (!friends) {
    throw new AppError("You are not friends with this user", 403);
  }

  // Find existing conversation or create a new one
  const conversation = await getOrCreateConversation(userId, friendId);

  const attachments = files.map((f) => ({
    url: `/uploads/${f.filename}`,
    name: f.originalname,
    mimeType: f.mimetype,
    kind: kindFromMime(f.mimetype),
    size: f.size,
  }));

  const message = await Message.create({
    conversationId: conversation._id,
    sender: userId,
    receiver: friendId,
    text: text.trim(),
    attachments,
  });

  // Notify receiver
  getIO().to(friendId.toString()).emit("newMessage", message);

  // Notify sender
  getIO().to(userId.toString()).emit("newMessage", message);

  return message;
};
