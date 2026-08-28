import { aiChatSchema } from "../validators/ai.validator.js";
import { AppError } from "../utils/AppError.js";
import { getAssistantService, sendAIMessageService } from "../services/ai.service.js";

// GET /api/ai
// Lets the frontend discover the shared AI assistant + this user's
// own AI conversation id, instead of the AI being hardcoded into a
// friends list.
export const getAssistant = async (req, res, next) => {
  try {
    const { assistant, conversationId } = await getAssistantService(req.userId);

    res.status(200).json({
      success: true,
      assistant: {
        _id: assistant._id,
        name: assistant.name,
        avatar: assistant.avatar,
        accountType: assistant.accountType,
      },
      conversationId,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/chat
// The authenticated user is always taken from req.userId (set by
// verifyToken), never from the request body.
export const chatWithAI = async (req, res, next) => {
  try {
    const result = aiChatSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(result.error.issues[0].message, 400);
    }

    const { userMessage, aiMessage } = await sendAIMessageService(
      req.userId,
      result.data.text,
    );

    res.status(201).json({ success: true, userMessage, aiMessage });
  } catch (error) {
    next(error);
  }
};
