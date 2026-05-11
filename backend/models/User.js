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
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },
    rollNumber: {
      type: String,
      unique: true,
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

const User = mongoose.model("User", userSchema);

export default User;
