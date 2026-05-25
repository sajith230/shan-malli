import mongoose, { Schema } from "mongoose";

const applicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    position: { type: String, required: true },
    skills: { type: String, default: "" },
    message: { type: String, default: "" },
    cvUrl: { type: String, default: "" },
    cvPublicId: { type: String, default: "" },
    cvFileName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Application = mongoose.model("Application", applicationSchema);
