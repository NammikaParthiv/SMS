import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";
import Log from "../models/Log.js";
import Marks from "../models/Marks.js";
import Notification from "../models/Notification.js";
import Submission from "../models/Submission.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import User from "../models/User.js";
import { logSystemEvent } from "../utils/logEvent.js";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import { ensureRollNumberForStudent } from "../utils/rollNumber.js";

const normalizeClass = (value) => String(value || "").trim().toUpperCase();

export const getAdiminController = async (req, res) => {
  try {
    const totalTeachersPromise = User.countDocuments({
      role: "teacher",
      $or: [{ approvalStatus: "approved" }],
    });
    const totalStudentsPromise = User.countDocuments({ 
      role: "student",
    $or: [{approvalStatus:"approved"}]
   });
    const totalAttendancePromise = Attendance.countDocuments();
    const presentAttendancePromise = Attendance.countDocuments({ status: "present" });
    const allMarksPromise = Marks.find().select("marksObtained maxMarks");

    const [totalTeachers, totalStudents, totalAttendance, presentAttendance, allMarks] =
      await Promise.all([
        totalTeachersPromise,
        totalStudentsPromise,
        totalAttendancePromise,
        presentAttendancePromise,
        allMarksPromise,
      ]);

    const attendancePercentage =
      totalAttendance === 0
        ? 0
        : Number(((presentAttendance / totalAttendance) * 100).toFixed(2));

    let passCount = 0;
    let failCount = 0;

    allMarks.forEach((m) => {
      const percent = (m.marksObtained / m.maxMarks) * 100;
      if (percent >= 35) passCount += 1;
      else failCount += 1;
    });

    const totalResult = passCount + failCount;
    const passPercentage =
      totalResult === 0 ? 0 : Number(((passCount / totalResult) * 100).toFixed(2));

    res.status(200).json({
      users: {
        totalTeachers,
        totalStudents,
      },
      attendance: {
        totalAttendance,
        presentAttendance,
        attendancePercentage,
      },
      results: {
        passCount,
        failCount,
        passPercentage,
      },
    });
  } catch {
    return res.status(500).json({
      msg: "Server error",
    });
  }
};

export const getAssignmentAudit = async (req, res) => {
  try {
    const { classAssigned, teacherId, q } = req.query;
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);

    const filter = {};
    if (classAssigned) filter.classAssigned = classAssigned;
    if (teacherId) filter.createdBy = teacherId;
    if (q) filter.title = { $regex: String(q), $options: "i" };

    const assignments = await Assignment.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalAssignments = await Assignment.countDocuments(filter);

    const items = await Promise.all(
      assignments.map(async (assignment) => {
        const [totalStudents, submittedCount] = await Promise.all([
          User.countDocuments({ role: "student", classAssigned: assignment.classAssigned }),
          Submission.countDocuments({ assignment: assignment._id }),
        ]);

        const pendingCount = Math.max(totalStudents - submittedCount, 0);
        const completionRate =
          totalStudents === 0 ? 0 : Number(((submittedCount / totalStudents) * 100).toFixed(2));

        return {
          assignmentId: assignment._id,
          title: assignment.title,
          classAssigned: assignment.classAssigned,
          dueDate: assignment.dueDate,
          createdAt: assignment.createdAt,
          teacher: assignment.createdBy
            ? {
                id: assignment.createdBy._id,
                name: assignment.createdBy.name,
                email: assignment.createdBy.email,
              }
            : null,
          totalStudents,
          submittedCount,
          pendingCount,
          completionRate,
          status: new Date(assignment.dueDate) < new Date() ? "overdue" : "active",
        };
      }),
    );

    res.status(200).json({
      page,
      limit,
      totalAssignments,
      items,
    });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const searchStudents = async (req, res) => {
  try {
    const { name, q, classAssigned } = req.query;
    const keyword = String(name || q || "").trim();

    if (!keyword) {
      return res.status(200).json({
        count: 0,
        items: [],
      });
    }

    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);

    const filter = {
      role: "student",
      name: { $regex: keyword, $options: "i" },
    };

    if (classAssigned) filter.classAssigned = classAssigned;

    const students = await User.find(filter)
      .select("name email classAssigned rollNumber createdAt")
      .sort({ name: 1 })
      .limit(limit);

    const items = students.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      classAssigned: s.classAssigned || "UNASSIGNED",
      rollNumber: s.rollNumber || null,
      class: s.classAssigned || "UNASSIGNED",
      createdAt: s.createdAt,
    }));

    res.status(200).json({
      count: items.length,
      items,
    });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const getPendingAdminApprovals = async (req, res) => {
  try {
    const pendingAdmins = await User.find({ role: "admin", approvalStatus: "pending" })
      .select("name email approvalStatus createdAt")
      .sort({ createdAt: -1 });

    const items = pendingAdmins.map((admin) => ({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      approvalStatus: admin.approvalStatus,
      createdAt: admin.createdAt,
    }));

    return res.status(200).json({
      count: items.length,
      items,
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getPendingTeacherApprovals = async (req, res) => {
  try {
    const pendingTeachers = await User.find({ role: "teacher", approvalStatus: "pending" })
      .select("name email teacherSubject approvalStatus createdAt")
      .sort({ createdAt: -1 });

    const items = pendingTeachers.map((teacher) => ({
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      teacherSubject: teacher.teacherSubject,
      approvalStatus: teacher.approvalStatus,
      createdAt: teacher.createdAt,
    }));

    return res.status(200).json({
      count: items.length,
      items,
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const approveAdminAccess = async (req, res) => {
  try {
    const { adminId } = req.params;

    const adminUser = await User.findById(adminId).select("name email role approvalStatus");

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(404).json({ msg: "Admin not found" });
    }

    if (adminUser.approvalStatus === "approved") {
      return res.status(200).json({ msg: "Admin is already approved" });
    }

    adminUser.approvalStatus = "approved";
    await adminUser.save();

    try {
      await Notification.create({
        student: adminUser._id,
        classAssigned: "ADMIN",
        type: "system",
        title: "Admin Access Approved",
        message: "Existing admins approved your access. You can now login.",
      });
    } catch (err) {
      console.error("Admin approval notification error:", err.message);
    }

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Admin Approved",
      target: `${adminUser.name} (${adminUser.email})`,
    });

    return res.status(200).json({
      msg: "Admin approved successfully",
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        approvalStatus: adminUser.approvalStatus,
      },
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const rejectAdminAccess = async (req, res) => {
  try {
    const { adminId } = req.params;

    const adminUser = await User.findById(adminId).select("name email role approvalStatus");

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(404).json({ msg: "Admin not found" });
    }

    if (adminUser.approvalStatus !== "pending") {
      return res.status(400).json({ msg: "Only pending admin requests can be rejected" });
    }

    await Notification.deleteMany({ student: adminId });
    await User.deleteOne({ _id: adminId });

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Admin Rejected",
      target: `${adminUser.name} (${adminUser.email})`,
    });

    return res.status(200).json({ msg: "Admin request rejected and removed" });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const approveTeacherAccess = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findById(teacherId).select(
      "name email role approvalStatus teacherSubject",
    );

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    if (teacher.approvalStatus === "approved") {
      return res.status(200).json({ msg: "Teacher is already approved" });
    }

    teacher.approvalStatus = "approved";
    await teacher.save();

    await Notification.create({
      student: teacher._id,
      classAssigned: "TEACHER",
      type: "system",
      title: "Access Approved",
      message: "Admin approved your account. You can now login and continue.",
    });

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Teacher Access Approved",
      target: `${teacher.name} (${teacher.email})`,
    });

    return res.status(200).json({
      msg: "Teacher approved successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        teacherSubject: teacher.teacherSubject,
        approvalStatus: teacher.approvalStatus,
      },
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getPendingStudentApprovals = async (req, res) => {
  try {
    const pendingStudents = await User.find({ role: "student", approvalStatus: "pending" })
      .select("name email classAssigned rollNumber approvalStatus createdAt")
      .sort({ createdAt: -1 });

    const items = pendingStudents.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      classAssigned: student.classAssigned || "UNASSIGNED",
      rollNumber: student.rollNumber || null,
      approvalStatus: student.approvalStatus,
      createdAt: student.createdAt,
    }));

    return res.status(200).json({ count: items.length, items });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const approveStudentAccess = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select("name email role approvalStatus classAssigned rollNumber");
    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    if (student.approvalStatus === "approved") {
      return res.status(200).json({ msg: "Student is already approved" });
    }

    await ensureRollNumberForStudent(student);

    student.approvalStatus = "approved";
    await student.save();

    await Notification.create({
      student: student._id,
      classAssigned: student.classAssigned || "STUDENT",
      type: "system",
      title: "Access Approved",
      message: "Admin approved your account. You can now login and continue.",
    });

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Student Access Approved",
      target: `${student.name} (${student.email})`,
    });

    return res.status(200).json({
      msg: "Student approved successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        classAssigned: student.classAssigned,
        approvalStatus: student.approvalStatus,
      },
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getClassAverageMarks = async (req, res) => {
  try {
    const rows = await Marks.aggregate([
      {
        $match: {
          classAssigned: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$classAssigned",
          totalObtained: { $sum: "$marksObtained" },
          totalMax: { $sum: "$maxMarks" },
        },
      },
    ]);

    const map = new Map(
      rows.map((row) => [
        row._id,
        row.totalMax ? Number(((row.totalObtained / row.totalMax) * 100).toFixed(2)) : 0,
      ]),
    );

    const items = ALLOWED_CLASSES.map((classAssigned) => ({
      classAssigned,
      average: map.get(classAssigned) || 0,
    }));

    return res.status(200).json({ count: items.length, items });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const sendNotificationBroadcast = async (req, res) => {
  try {
    const { audience, title, message } = req.body;

    const resolvedTitle = String(title || "").trim();
    const resolvedMessage = String(message || "").trim();

    if (!resolvedTitle || !resolvedMessage) {
      return res.status(400).json({ msg: "Title and message are required" });
    }

    let roles = ["teacher", "student"];
    if (audience === "teachers") roles = ["teacher"];
    if (audience === "students") roles = ["student"];

    const recipients = await User.find({
      role: { $in: roles },
      $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
    }).select("_id classAssigned");

    if (recipients.length === 0) {
      return res.status(200).json({ msg: "No recipients found", count: 0 });
    }

    await Notification.insertMany(
      recipients.map((user) => ({
        student: user._id,
        classAssigned: user.classAssigned || "BROADCAST",
        type: "system",
        title: resolvedTitle,
        message: resolvedMessage,
      })),
    );

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Admin Broadcast",
      target: `Audience: ${audience || "all"} | Count: ${recipients.length}`,
    });

    return res.status(200).json({
      msg: "Notification sent",
      count: recipients.length,
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getSystemLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const { status, operator, action } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (operator) filter.operator = { $regex: String(operator), $options: "i" };
    if (action) filter.action = { $regex: String(action), $options: "i" };

    const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(limit);

    res.status(200).json({
      count: logs.length,
      logs,
    });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const deleteTeacherAccount = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ msg: "Teacher id is required" });
    }

    if (teacherId === req.user.id) {
      return res.status(400).json({ msg: "You cannot delete your own account" });
    }

    const teacher = await User.findById(teacherId).select("role name email");
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    const assignmentIds = await Assignment.find({ createdBy: teacherId }).distinct("_id");

    await Promise.all([
      TeacherAllocation.deleteMany({ teacher: teacherId }),
      Assignment.deleteMany({ createdBy: teacherId }),
      Submission.deleteMany({ assignment: { $in: assignmentIds } }),
      Notification.deleteMany({ student: teacherId }),
      User.deleteOne({ _id: teacherId }),
    ]);

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Teacher Deleted",
      target: `${teacher.name} (${teacher.email})`,
    });

    return res.status(200).json({ msg: "Teacher deleted" });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const deleteStudentAccount = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ msg: "Student id is required" });
    }

    const student = await User.findById(studentId).select("role name email");
    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    await Promise.all([
      Marks.deleteMany({ student: studentId }),
      Attendance.deleteMany({ student: studentId }),
      Submission.deleteMany({ student: studentId }),
      Notification.deleteMany({ student: studentId }),
      User.deleteOne({ _id: studentId }),
    ]);

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Student Deleted",
      target: `${student.name} (${student.email})`,
    });

    return res.status(200).json({ msg: "Student deleted" });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const deleteClassData = async (req, res) => {
  try {
    const classAssigned = normalizeClass(req.params.classAssigned);

    if (!ALLOWED_CLASSES.includes(classAssigned)) {
      return res.status(400).json({ msg: "Invalid class" });
    }

    const studentIds = await User.find({ role: "student", classAssigned }).distinct("_id");
    const assignmentIds = await Assignment.find({ classAssigned }).distinct("_id");

    await Promise.all([
      Marks.deleteMany({ classAssigned }),
      Attendance.deleteMany({ student: { $in: studentIds } }),
      Submission.deleteMany({ student: { $in: studentIds } }),
      Submission.deleteMany({ assignment: { $in: assignmentIds } }),
      Assignment.deleteMany({ classAssigned }),
      TeacherAllocation.deleteMany({ classAssigned }),
      User.updateMany({ role: "student", classAssigned }, { $set: { classAssigned: null } }),
    ]);

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Class Data Cleared",
      target: `Class ${classAssigned}`,
    });

    return res.status(200).json({ msg: `Class ${classAssigned} cleared` });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};
