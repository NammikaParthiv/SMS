import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";
import Marks from "../models/Marks.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import { ensureRollNumberForStudent } from "../utils/rollNumber.js";

const buildStudentProfilePayload = async (studentDoc) => {
  const studentId = studentDoc._id;
  const classAssigned = studentDoc.classAssigned || "UNASSIGNED";

  await ensureRollNumberForStudent(studentDoc);

  const [marksDocs, attendanceDocs, classAssignments, submittedAssignments] = await Promise.all([
    Marks.find({ student: studentId }).sort({ createdAt: -1 }),
    Attendance.find({ student: studentId }).select("status"),
    Assignment.find({ classAssigned }).select("_id"),
    Submission.find({ student: studentId }).select("assignment"),
  ]);

  const totalObtained = marksDocs.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = marksDocs.reduce((sum, m) => sum + m.maxMarks, 0);
  const average = totalMax === 0 ? 0 : Number(((totalObtained / totalMax) * 100).toFixed(2));

  const totalAttendance = attendanceDocs.length;
  const presentAttendance = attendanceDocs.filter((a) => a.status === "present").length;
  const absentAttendance = Math.max(totalAttendance - presentAttendance, 0);
  const attendance =
    totalAttendance === 0
      ? 0
      : Number(((presentAttendance / totalAttendance) * 100).toFixed(2));

  const assignedIds = classAssignments.map((a) => a._id.toString());
  const submittedIds = new Set(submittedAssignments.map((s) => s.assignment.toString()));
  const pendingTasks = assignedIds.filter((taskId) => !submittedIds.has(taskId)).length;

  return {
    _id: studentDoc._id,
    name: studentDoc.name,
    email: studentDoc.email,
    role: studentDoc.role,
    classAssigned,
    class: classAssigned,
    rollNumber: studentDoc.rollNumber || null,
    photo: studentDoc.photo || null,
    average,
    attendance,
    attendancePresentDays: presentAttendance,
    attendanceAbsentDays: absentAttendance,
    attendanceTotalDays: totalAttendance,
    pendingTasks,
    marks: marksDocs.map((m) => ({
      subject: m.subject,
      score: m.marksObtained,
      total: m.maxMarks,
      examName: m.examName,
      createdAt: m.createdAt,
    })),
  };
};

export const getAllStudents = async (req, res) => {
  try {
    const { q, name, classAssigned } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 300);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    const filter = { role: "student" };

    const searchText = (q || name || "").trim();
    if (searchText) {
      filter.name = { $regex: searchText, $options: "i" };
    }

    if (classAssigned) {
      filter.classAssigned = classAssigned;
    }

    const status = String(req.query.status || "").trim().toLowerCase();
    if (status === "pending") {
      filter.approvalStatus = "pending";
    } else {
      filter.$or = [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }];
    }

    const students = await User.find(filter)
      .select("-password")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    for (const student of students) {
      if (!student.rollNumber) {
        await ensureRollNumberForStudent(student);
      }
    }

    const payload = students.map((student) => ({
      ...student.toObject(),
      class: student.classAssigned || "UNASSIGNED",
    }));

    res.status(200).json(payload);
  } catch {
    res.status(500).json({ msg: "Error fetching students" });
  }
};

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "teacher",
      $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
    })
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json(teachers);
  } catch {
    res.status(500).json({ msg: "Error fetching teachers" });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?.role === "student" && req.user.id !== id) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const student = await User.findById(id).select("-password");
    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    const profile = await buildStudentProfilePayload(student);
    res.status(200).json(profile);
  } catch {
    res.status(500).json({ msg: "Server error fetching profile" });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select("-password");

    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    await ensureRollNumberForStudent(student);
    const profile = await buildStudentProfilePayload(student);

    res.status(200).json({
      student: profile,
      marks: profile.marks,
    });
  } catch {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateStudentPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const wantsDelete = String(req.body?.delete || req.query?.delete || "").toLowerCase() === "true";

    const isAdmin = req.user?.role === "admin";
    const isOwnStudent = req.user?.role === "student" && req.user.id === id;

    if (!isAdmin && !isOwnStudent) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const student = await User.findById(id).select("-password");
    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    if (wantsDelete) {
      student.photo = null;
      await student.save();

      const profile = await buildStudentProfilePayload(student);
      return res.status(200).json({
        msg: "Profile photo removed",
        photo: null,
        student: profile,
      });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "Photo file is required" });
    }

    const normalizedPath = req.file.path.replace(/\\/g, "/");
    const photoUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;

    student.photo = photoUrl;
    await student.save();

    const profile = await buildStudentProfilePayload(student);

    return res.status(200).json({
      msg: "Profile photo updated",
      photo: photoUrl,
      student: profile,
    });
  } catch {
    return res.status(500).json({ msg: "Server error updating photo" });
  }
};

