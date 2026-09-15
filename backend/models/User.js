import mongoose from "mongoose";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import { TEACHER_SUBJECTS } from "../constants/teacherOnboarding.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },
    rollNumber: {
      type: String,
      sparse: true,//docs that actually have the feild
      trim: true,
    },
    classAssigned: {
      type: String,
      default: null,
      validate: {
        validator: function validateClass(value) {
          return value === null || ALLOWED_CLASSES.includes(value);
        },
        message: "Invalid classAssigned value",
      },
    },
    teacherSubject: {
      type: String,
      default: null,
      validate: {
        validator: function validateTeacherSubject(value) {
          return value === null || TEACHER_SUBJECTS.includes(String(value).trim().toLowerCase());
        },
        message: "Invalid teacherSubject value",
      },
    },
    approvalStatus: {
      type: String,
      enum: ["approved", "pending"],
      default: "approved",
    },
    photo: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Roll sequences restart per actual class (for example 8-A and 8-B), not globally.
userSchema.index(
  { classAssigned: 1, rollNumber: 1 },
  { unique: true, partialFilterExpression: { rollNumber: { $type: "string" } } },
);

const User = mongoose.model("User", userSchema);

export default User;
