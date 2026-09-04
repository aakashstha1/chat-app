import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getOrCreateConversation } from "./conversation.service.js";
import { AppError } from "../utils/AppError.js";
import { generateResponse } from "../ai/ai.provider.js";
import { SYSTEM_PROMPT } from "../ai/ai.prompt.js";
import { getIO } from "../socket/socket.js";
// How many recent messages (both the user's and the AI's) to send as
// context on every request. Kept small and bounded on purpose - see
// the "Long-Term Memory" note below for how this is meant to grow.
const AI_CONTEXT_MESSAGES = Math.max(
  parseInt(process.env.AI_CONTEXT_MESSAGES) || 20,
  2,
);

// The AI system user is a single shared document. It changes rarely
// (never, in practice), so we cache its id in memory for the life of
// the process instead of hitting Mongo on every single chat request.
let cachedAIUser = null;

export const getAIUser = async () => {
  if (cachedAIUser) return cachedAIUser;

  const aiUser = await User.findOne({ accountType: "ai" }).select(
    "_id name avatar bio accountType",
  );

  if (!aiUser) {
    // Distinct from "invalid input" - this means the deployment
    // forgot to run the seed script.
    throw new AppError(
      "AI assistant is not available. Please contact support.",
      503,
    );
  }

  cachedAIUser = aiUser;
  return aiUser;
};

// GET /api/ai - lets the frontend discover the assistant + the
// conversation it should open, without ever guessing an id.
export const getAssistantService = async (userId) => {
  const aiUser = await getAIUser();
  const conversation = await getOrCreateConversation(userId, aiUser._id);

  return { assistant: aiUser, conversationId: conversation._id };
};

// POST /api/ai/chat
//
// Flow: find AI user -> get/create THIS user's private AI conversation
// -> persist the user's message -> pull recent history from that same
// conversation -> call the provider -> persist + emit the AI's reply.
//
// Both messages are stored in the existing Message collection (no
// separate AIMessage collection), scoped to a conversation that only
// this user and the AI participate in - so there is no code path that
// could ever mix one user's AI history with another's.
export const sendAIMessageService = async (userId, rawText) => {
  const text = (rawText || "").trim();

  if (!text) {
    throw new AppError("Message cannot be empty", 400);
  }

  const aiUser = await getAIUser();
  const aiUserId = aiUser._id;

  const conversation = await getOrCreateConversation(userId, aiUserId);

  const userMessage = await Message.create({
    conversationId: conversation._id,
    sender: userId,
    receiver: aiUserId,
    text,
  });

  getIO().to(userId.toString()).emit("newMessage", userMessage);

  // Pull the most recent N messages (this already includes the
  // message we just saved, since it's now the newest one), sorted
  // chronologically before handing them to the LLM.
  const recentMessages = await Message.find({
    conversationId: conversation._id,
  })
    .sort({ createdAt: -1 })
    .limit(AI_CONTEXT_MESSAGES)
    .select("sender text");

  const history = recentMessages
    .reverse()
    .filter((m) => m.text) // skip attachment-only messages for now
    .map((m) => ({
      role: m.sender.toString() === aiUserId.toString() ? "assistant" : "user",
      content: m.text,
    }));

  // --- Long-term memory extension point -----------------------------
  // Today: [system prompt, ...recent history] -> LLM.
  // Later, without changing the shape of this function's contract:
  //   [system prompt, userMemorySummary, conversationSummary,
  //    ...recentHistory] -> LLM
  // userMemorySummary / conversationSummary would be produced by a
  // separate summarization job and stored alongside the conversation
  // (e.g. a `summary` field on Conversation), not computed inline here.
  // --------------------------------------------------------------------
  const providerMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  const replyText = await generateResponse(providerMessages);

  const aiMessage = await Message.create({
    conversationId: conversation._id,
    sender: aiUserId,
    receiver: userId,
    text: replyText,
  });

  getIO().to(userId.toString()).emit("newMessage", aiMessage);

  return { userMessage, aiMessage };
};
