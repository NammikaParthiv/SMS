import mongoose from "mongoose";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";

const noteSchema = new mongoose.Schema(
  {
    classAssigned: {
      type: String,
      enum: ALLOWED_CLASSES,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

noteSchema.index({ classAssigned: 1, subject: 1, createdAt: -1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;
