import mongoose, { Schema } from "mongoose";

const exampleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Example = mongoose.model("Example", exampleSchema);
