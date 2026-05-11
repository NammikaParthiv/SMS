import mongoose from "mongoose";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";

const teacherAllocationSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
  },
  { timestamps: true },
);

teacherAllocationSchema.index({ teacher: 1, classAssigned: 1, subject: 1 }, { unique: true });

const TeacherAllocation = mongoose.model("TeacherAllocation", teacherAllocationSchema);

export default TeacherAllocation;
