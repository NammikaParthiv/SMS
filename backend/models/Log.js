import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  operator: { type: String, required: true }, // Name of Admin/Teacher
  action: { type: String, required: true },   // "Updated Marks"
  target: { type: String },                   // "Student: Arjun"
  status: { type: String, default: "Success" },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Log", logSchema);