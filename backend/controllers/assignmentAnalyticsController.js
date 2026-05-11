import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";

export const getAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        msg: "Assignment not found",
      });
    }

    const students = await User.find({
      role: "student",
      classAssigned: assignment.classAssigned,
    }).select("_id name email");

    const submissions = await Submission.find({ assignment: assignmentId }).select("student");

    const submittedStudentIds = new Set(
      submissions.map((submission) => submission.student.toString()),
    );

    const submittedStudents = [];
    const notSubmittedStudents = [];

    students.forEach((student) => {
      if (submittedStudentIds.has(student._id.toString())) {
        submittedStudents.push(student);
      } else {
        notSubmittedStudents.push(student);
      }
    });

    res.status(200).json({
      assignmentId,
      classAssigned: assignment.classAssigned,
      totalStudents: students.length,
      submittedCount: submittedStudents.length,
      notSubmittedCount: notSubmittedStudents.length,
      submittedStudents,
      notSubmittedStudents,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Server error",
    });
  }
};
