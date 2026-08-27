import {
  getMessagesService,
  sendMessageService,
} from "../services/message.service.js";

// GET /api/messages/:friendId?page=&limit=
export const getMessages = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const result = await getMessagesService(friendId, page, limit, req.userId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/messages/:friendId  (multipart/form-data: text, files[])
export const sendMessage = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const { text = "" } = req.body;
    const files = req.files || [];

    const message = await sendMessageService(friendId, text, files, req.userId);

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};
