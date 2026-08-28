import Conversation from "../models/conversation.model.js";
import { AppError } from "../utils/AppError.js";

// Two users always map to the same key regardless of who initiated
// the conversation: [Aakash, Ram] and [Ram, Aakash] both become
// "aakashId_ramId" (ids sorted lexicographically).
const buildParticipantsKey = (userIdA, userIdB) =>
  [userIdA.toString(), userIdB.toString()].sort().join("_");

// Finds the 1-to-1 conversation between userId and otherUserId, or
// creates it if it doesn't exist yet.
//
// Uses findOneAndUpdate + upsert instead of "find, then create if
// missing" because the latter has a race condition: two simultaneous
// requests (e.g. two socket events, or a double-click) could both see
// "no conversation exists" and both create one. findOneAndUpdate with
// upsert is atomic at the database level, and the unique index on
// participantsKey (see conversation.model.js) is the final guarantee
// even if two upserts somehow race - one will win, the other will
// throw a duplicate key error which we retry as a plain lookup.
export const getOrCreateConversation = async (userId, otherUserId) => {
  if (!userId || !otherUserId) {
    throw new AppError("Both participants are required", 400);
  }

  if (userId.toString() === otherUserId.toString()) {
    throw new AppError("Cannot create a conversation with yourself", 400);
  }

  const participantsKey = buildParticipantsKey(userId, otherUserId);

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { participantsKey },
      {
        $setOnInsert: {
          participants: [userId, otherUserId],
          participantsKey,
        },
      },
      { returnNewDocument: true, upsert: true },
    );

    return conversation;
  } catch (error) {
    // Duplicate key race: another concurrent request created it first.
    if (error?.code === 11000) {
      const conversation = await Conversation.findOne({ participantsKey });
      if (conversation) return conversation;
    }
    throw error;
  }
};

// Returns the existing 1-to-1 conversation between two users, or null.
// Useful for read paths that should NOT create a conversation as a
// side effect (e.g. listing message history for a pair that never
// talked).
export const findConversation = async (userId, otherUserId) => {
  const participantsKey = buildParticipantsKey(userId, otherUserId);
  return Conversation.findOne({ participantsKey });
};

// Guards against a client-supplied conversation id being used to read
// someone else's conversation.
export const isParticipant = (conversation, userId) =>
  conversation.participants.some((p) => p.toString() === userId.toString());
