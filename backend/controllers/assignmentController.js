import Assignment from "../models/Assignment.js";
import Notification from "../models/Notification.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import { logSystemEvent } from "../utils/logEvent.js";
import { ensureRollNumberForStudent } from "../utils/rollNumber.js";

const normalizePath = (value) => String(value || "").replace(/\\/g, "/");

export const createAssignmet = async (req, res) => {
  try {
    const { title, description, classAssigned, dueDate } = req.body;

    if (!title || !description || !classAssigned || !dueDate) {
      return res.status(400).json({ msg: "All details are required!" });
    }

    if (!ALLOWED_CLASSES.includes(classAssigned)) {
      return res.status(400).json({ msg: "Invalid class. Allowed: 8-A to 10-D" });
    }

    const classStudents = await User.find({ role: "student", classAssigned }).select("_id");
    if (classStudents.length === 0) {
      return res.status(404).json({ msg: "No student found in this class" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "File is Required!" });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ msg: "Invalid due date" });
    }

    const assignment = await Assignment.create({
      title,
      description,
      classAssigned,
      dueDate: parsedDueDate,
      createdBy: req.user.id,
      fileUrl: normalizePath(req.file.path),
    });

    try {
      const notificationDocs = classStudents.map((student) => ({
        student: student._id,
        assignment: assignment._id,
        classAssigned,
        type: "assignment",
        title: "New Assignment Published",
        message: `${title} has been assigned for ${classAssigned}. Due: ${parsedDueDate.toLocaleDateString()}`,
      }));

      await Notification.insertMany(notificationDocs);
    } catch {
      await Assignment.findByIdAndDelete(assignment._id);
      return res.status(500).json({ msg: "Failed to notify students for this class" });
    }

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Assignment Created",
      target: `${assignment.title} -> Class ${assignment.classAssigned}`,
    });

    res.status(201).json({
      msg: "Assignment created successfully",
      assignment,
      notificationsSent: classStudents.length,
    });
  } catch {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const extendAssignmentDueDate = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({ msg: "New due date is required" });
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ msg: "Invalid due date" });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      createdBy: req.user.id,
    });

    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }

    if (parsedDueDate.getTime() <= new Date(assignment.dueDate).getTime()) {
      return res.status(400).json({ msg: "New due date must be later than current due date" });
    }

    assignment.dueDate = parsedDueDate;
    await assignment.save();

    const classStudents = await User.find({ role: "student", classAssigned: assignment.classAssigned }).select("_id");

    if (classStudents.length > 0) {
      const notificationDocs = classStudents.map((student) => ({
        student: student._id,
        assignment: assignment._id,
        classAssigned: assignment.classAssigned,
        type: "assignment",
        title: "Assignment Due Date Extended",
        message: `${assignment.title} due date is extended to ${parsedDueDate.toLocaleDateString()}.`,
      }));

      await Notification.insertMany(notificationDocs);
    }

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Assignment Due Date Extended",
      target: `${assignment.title} -> ${parsedDueDate.toISOString()}`,
    });

    return res.status(200).json({
      msg: "Due date extended successfully",
      assignment: {
        id: assignment._id,
        dueDate: assignment.dueDate,
      },
    });
  } catch {
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const getTeacherAssignments = async (req, res) => {
  try {
    const { classAssigned, status } = req.query;

    const filter = { createdBy: req.user.id };
    if (classAssigned) filter.classAssigned = classAssigned;

    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const [totalStudents, submittedCount] = await Promise.all([
          User.countDocuments({ role: "student", classAssigned: assignment.classAssigned }),
          Submission.countDocuments({ assignment: assignment._id }),
        ]);

        const pendingCount = Math.max(totalStudents - submittedCount, 0);
        const assignmentStatus = new Date(assignment.dueDate) < new Date() ? "Overdue" : "Active";

        return {
          id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          classAssigned: assignment.classAssigned,
          dueDate: assignment.dueDate,
          fileUrl: normalizePath(assignment.fileUrl),
          submissions: submittedCount,
          totalStudents,
          pendingCount,
          status: assignmentStatus,
          createdAt: assignment.createdAt,
        };
      }),
    );

    const items = status
      ? enriched.filter((item) => item.status.toLowerCase() === String(status).toLowerCase())
      : enriched;

    res.status(200).json({ count: items.length, items });
  } catch {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getStudentAssignments = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select("classAssigned role");

    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    if (!student.classAssigned) {
      return res.status(400).json({ msg: "Student class is not assigned" });
    }

    const assignments = await Assignment.find({ classAssigned: student.classAssigned })
      .sort({ createdAt: -1 })
      .select("title description classAssigned dueDate fileUrl createdAt");

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      student: student._id,
      assignment: { $in: assignmentIds },
    }).select("assignment submittedAt isLate");

    const submissionMap = new Map(
      submissions.map((s) => [s.assignment.toString(), s]),
    );

    const items = assignments.map((assignment) => {
      const key = assignment._id.toString();
      const submission = submissionMap.get(key);
      const isOverDue = new Date(assignment.dueDate) < new Date();

      let status = "Pending";
      if (submission) status = "Submitted";
      else if (isOverDue) status = "Late";

      return {
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        classAssigned: assignment.classAssigned,
        dueDate: assignment.dueDate,
        fileUrl: normalizePath(assignment.fileUrl),
        status,
        submittedAt: submission?.submittedAt || null,
        isLate: submission?.isLate || false,
      };
    });

    res.status(200).json({
      classAssigned: student.classAssigned,
      count: items.length,
      items,
    });
  } catch {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getAssignmentSubmissionsForTeacher = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId).select(
      "title description classAssigned dueDate createdBy fileUrl",
    );

    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }

    if (String(assignment.createdBy) !== req.user.id) {
      return res.status(403).json({ msg: "You can only view submissions for your assignments" });
    }

    const students = await User.find({ role: "student", classAssigned: assignment.classAssigned })
      .select("name email classAssigned rollNumber approvalStatus")
      .sort({ name: 1 });

    const submissions = await Submission.find({ assignment: assignmentId })
      .select("student fileUrl submittedAt isLate createdAt")
      .lean();

    const submissionMap = new Map(
      submissions.map((row) => [
        String(row.student),
        {
          ...row,
          fileUrl: normalizePath(row.fileUrl),
        },
      ]),
    );

    const rollSortValue = (value) => {
      const digits = String(value || "").match(/\d+/g);
      if (!digits) return Number.MAX_SAFE_INTEGER;
      const last = Number(digits[digits.length - 1]);
      return Number.isFinite(last) ? last : Number.MAX_SAFE_INTEGER;
    };

    const preparedStudents = [];
    for (const student of students) {
      if (!student.rollNumber) {
        await ensureRollNumberForStudent(student);
      }
      preparedStudents.push(student);
    }

    preparedStudents.sort((a, b) => {
      const rollA = rollSortValue(a.rollNumber);
      const rollB = rollSortValue(b.rollNumber);
      if (rollA !== rollB) return rollA - rollB;
      return a.name.localeCompare(b.name);
    });

    const studentRows = preparedStudents.map((student) => {
      const submission = submissionMap.get(String(student._id));
      return {
        id: student._id,
        name: student.name,
        email: student.email,
        classAssigned: student.classAssigned,
        rollNumber: student.rollNumber || null,
        approvalStatus: student.approvalStatus || null,
        hasSubmitted: Boolean(submission),
        submittedAt: submission?.submittedAt || null,
        isLate: submission?.isLate || false,
        fileUrl: submission?.fileUrl || null,
      };
    });

    const totalStudents = preparedStudents.length;
    const submittedCount = submissions.length;
    const pendingCount = Math.max(totalStudents - submittedCount, 0);

    return res.status(200).json({
      assignment: {
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        classAssigned: assignment.classAssigned,
        dueDate: assignment.dueDate,
        fileUrl: normalizePath(assignment.fileUrl),
      },
      summary: {
        totalStudents,
        submittedCount,
        pendingCount,
      },
      students: studentRows,
    });
  } catch {
    return res.status(500).json({ msg: "Server Error" });
  }
};
