import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import { logSystemEvent } from "../utils/logEvent.js";

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        msg: "Assignment not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        msg: "Submission file is required",
      });
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user.id,
      fileUrl: req.file.path,
      isLate,
    });

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Assignment Submitted",
      target: `${assignment.title} (${isLate ? "Late" : "On Time"})`,
      status: isLate ? "Warning" : "Success",
    });

    res.status(201).json({
      msg: "Assignment submitted successfully",
      submission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        msg: "You already submitted this assignment",
      });
    }

    res.status(500).json({
      msg: "Server Error!",
    });
  }
};
