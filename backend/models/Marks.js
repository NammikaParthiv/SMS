import mongoose from "mongoose";

const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //marks of prev year clases will be stored right?
    classAssigned: {
      type: String,
      required: true,
    },
    examName: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true },
);

marksSchema.index({ student: 1, examName: 1, subject: 1 }, { unique: true });

const Marks = mongoose.model("Marks", marksSchema);

export default Marks;
