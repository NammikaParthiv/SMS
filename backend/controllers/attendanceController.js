import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import { logSystemEvent } from "../utils/logEvent.js";

const normalizeClass = (value) => String(value || "").trim().toUpperCase();

const parseUtcDate = (dateInput) => {
  const raw = String(dateInput || "").trim();
  if (!raw) return null;

  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const isTodayUtc = (date) => {
  if (!date) return false;
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return date.getTime() === todayUtc.getTime();
};

const getAcademicStartYear = (inputYear) => {
  const parsed = Number(inputYear);
  if (!Number.isNaN(parsed) && parsed >= 2000 && parsed <= 2100) return parsed;

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  return currentMonth >= 6 ? currentYear : currentYear - 1;
};

const getAcademicBounds = (startYear) => {
  const start = new Date(Date.UTC(startYear, 6, 1, 0, 0, 0, 0)); // July 1
  const end = new Date(Date.UTC(startYear + 1, 4, 31, 23, 59, 59, 999)); // May 31
  return { start, end };
};

const hasTeacherClassAccess = async (teacherId, classAssigned) => {
  const allocationCount = await TeacherAllocation.countDocuments({
    teacher: teacherId,
    classAssigned,
  });
  return allocationCount > 0;
};

export const markAttendance = async (req, res) => {
  try {
    const { classAssigned, date, AttendanceList } = req.body;

    const normalizedClass = normalizeClass(classAssigned);
    const parsedDate = parseUtcDate(date);

    if (!normalizedClass || !parsedDate || !Array.isArray(AttendanceList) || AttendanceList.length === 0) {
      return res.status(400).json({
        msg: "class, date, AttendanceList all are required",
      });
    }

    if (!isTodayUtc(parsedDate)) {
      return res.status(400).json({ msg: "Attendance can only be marked for today" });
    }

    const canEdit = await hasTeacherClassAccess(req.user.id, normalizedClass);
    if (!canEdit) {
      return res.status(403).json({ msg: "You can edit attendance only for your allocated classes" });
    }

    const students = await User.find({
      role: "student",
      classAssigned: normalizedClass,
    }).select("_id");

    if (students.length === 0) {
      return res.status(400).json({
        msg: "No students in this class",
      });
    }

    const studentIdSet = new Set(students.map((student) => String(student._id)));

    const hasInvalidPayload = AttendanceList.some((item) => {
      const studentId = String(item.studentId || "");
      const status = String(item.status || "").toLowerCase();
      return !studentIdSet.has(studentId) || !["present", "absent"].includes(status);
    });

    if (hasInvalidPayload) {
      return res.status(400).json({
        msg: "Invalid student or status in AttendanceList",
      });
    }

    const operations = AttendanceList.map((item) => ({
      updateOne: {
        filter: {
          student: item.studentId,
          date: parsedDate,
        },
        update: {
          student: item.studentId,
          classAssigned: normalizedClass,
          date: parsedDate,
          status: String(item.status).toLowerCase(),
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations, { ordered: false });

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Attendance Updated",
      target: `Class ${normalizedClass} (${AttendanceList.length} records)`,
    });

    return res.status(200).json({
      msg: "Attendance saved successfully",
      classAssigned: normalizedClass,
      date: parsedDate.toISOString().split("T")[0],
      count: AttendanceList.length,
    });
  } catch {
    return res.status(500).json({
      msg: "Server Error",
    });
  }
};

export const getClassAttendanceForDate = async (req, res) => {
  try {
    const classAssigned = normalizeClass(req.params.classAssigned);
    const parsedDate = parseUtcDate(req.query.date);

    if (!classAssigned || !parsedDate) {
      return res.status(400).json({ msg: "class and date are required" });
    }

    const canView = await hasTeacherClassAccess(req.user.id, classAssigned);
    if (!canView) {
      return res.status(403).json({ msg: "You can view attendance only for your allocated classes" });
    }

    const students = await User.find({ role: "student", classAssigned })
      .select("name email classAssigned")
      .sort({ name: 1 });

    const records = await Attendance.find({ classAssigned, date: parsedDate }).select("student status");
    const statusMap = new Map(records.map((record) => [String(record.student), record.status]));

    const items = students.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      classAssigned: student.classAssigned,
      status: statusMap.get(String(student._id)) || null,
    }));

    return res.status(200).json({
      classAssigned,
      date: parsedDate.toISOString().split("T")[0],
      count: items.length,
      items,
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getMyAcademicAttendance = async (req, res) => {
  try {
    const academicStartYear = getAcademicStartYear(req.query.academicStartYear);
    const { start, end } = getAcademicBounds(academicStartYear);

    const records = await Attendance.find({
      student: req.user.id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    const statusByDate = {};
    let presentCount = 0;
    let absentCount = 0;

    records.forEach((record) => {
      const dateKey = new Date(record.date).toISOString().split("T")[0];
      statusByDate[dateKey] = record.status;

      if (record.status === "present") presentCount += 1;
      if (record.status === "absent") absentCount += 1;
    });

    const totalMarkedDays = presentCount + absentCount;
    const percentage =
      totalMarkedDays === 0 ? 0 : Number(((presentCount / totalMarkedDays) * 100).toFixed(2));

    return res.status(200).json({
      academicStartYear,
      academicEndYear: academicStartYear + 1,
      range: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
      totals: {
        present: presentCount,
        absent: absentCount,
        totalMarkedDays,
        percentage,
      },
      statusByDate,
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};
