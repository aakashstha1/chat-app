import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    kind: {
      type: String,
      enum: ["image", "video", "file"],
      default: "file",
    },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: "" },
    attachments: [attachmentSchema],
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// Primary access pattern going forward: fetch a conversation's
// messages in chronological/reverse-chronological order. Used by both
// normal message pagination and AI context retrieval.
messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
