import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Deterministic fingerprint of the two participant ids, always
    // built from the SORTED ids (see conversation.service.js). This is
    // what actually guarantees "no duplicate conversations": a unique
    // index on an array field (participants) does not enforce
    // "no duplicate pair regardless of order", but a unique index on
    // this derived string does.
    participantsKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ participants: 1 });

export default mongoose.model("Conversation", conversationSchema);
