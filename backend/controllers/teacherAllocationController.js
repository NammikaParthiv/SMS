import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Marks from "../models/Marks.js";
import { TEACHER_SUBJECTS } from "../constants/teacherOnboarding.js";
import { ensureRollNumberForStudent } from "../utils/rollNumber.js";

const normalizeClass = (value) => String(value || "").trim().toUpperCase();
const normalizeSubject = (value) => String(value || "").trim().toLowerCase();

const buildCoverageGrid = async () => {
  const allocations = await TeacherAllocation.find({})
    .populate("teacher", "name email teacherSubject")
    .lean();

  const lookup = new Map();
  allocations.forEach((row) => {
    const key = `${row.classAssigned}|${row.subject}`;
    lookup.set(key, row);
  });

  const classes = ALLOWED_CLASSES.map((classAssigned) => {
    const subjects = TEACHER_SUBJECTS.map((subject) => {
      const allocation = lookup.get(`${classAssigned}|${subject}`);
      return {
        subject,
        allocationId: allocation?._id || null,
        status: allocation ? "allocated" : "missing",
        teacher: allocation?.teacher
          ? {
              id: allocation.teacher._id,
              name: allocation.teacher.name,
              email: allocation.teacher.email,
              subject: allocation.teacher.teacherSubject,
            }
          : null,
      };
    });

    const missingCount = subjects.filter((s) => s.status === "missing").length;
    return {
      classAssigned,
      missingCount,
      totalSubjects: TEACHER_SUBJECTS.length,
      subjects,
    };
  });

  const missingPairs = [];
  classes.forEach((cls) => {
    cls.subjects.forEach((subj) => {
      if (subj.status === "missing") {
        missingPairs.push({ classAssigned: cls.classAssigned, subject: subj.subject });
      }
    });
  });

  return { classes, missingPairs };
};

export const getTeacherAllocations = async (req, res) => {
  try {
    const { teacherId, classAssigned } = req.query;
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 500);

    const filter = {};
    if (teacherId) filter.teacher = teacherId;
    if (classAssigned) filter.classAssigned = normalizeClass(classAssigned);

    const allocations = await TeacherAllocation.find(filter)
      .populate("teacher", "name email")
      .sort({ classAssigned: 1, subject: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const items = allocations.map((allocation) => ({
      id: allocation._id,
      classAssigned: allocation.classAssigned,
      subject: allocation.subject,
      createdAt: allocation.createdAt,
      teacher: allocation.teacher
        ? {
            id: allocation.teacher._id,
            name: allocation.teacher.name,
            email: allocation.teacher.email,
          }
        : null,
    }));

    res.status(200).json({ page, limit, count: items.length, items });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const getAllocationCoverage = async (_req, res) => {
  try {
    const coverage = await buildCoverageGrid();
    res.status(200).json(coverage);
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const autoFillAllocations = async (_req, res) => {
  try {
    const existing = await TeacherAllocation.find({}).select("classAssigned subject").lean();
    const existingKeys = new Set(existing.map((row) => `${row.classAssigned}|${row.subject}`));

    const teachers = await User.find({
      role: "teacher",
      teacherSubject: { $in: TEACHER_SUBJECTS },
      $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
    })
      .select("_id name email teacherSubject")
      .lean();

    const teacherBySubject = TEACHER_SUBJECTS.reduce((acc, subject) => {
      acc[subject] = teachers.filter(
        (t) => String(t.teacherSubject || "").trim().toLowerCase() === subject,
      );
      return acc;
    }, {});

    const newAllocations = [];
    const unresolved = [];

    ALLOWED_CLASSES.forEach((classAssigned, classIndex) => {
      TEACHER_SUBJECTS.forEach((subject) => {
        const key = `${classAssigned}|${subject}`;
        if (existingKeys.has(key)) return;

        const pool = teacherBySubject[subject] || [];
        if (pool.length === 0) {
          unresolved.push({ classAssigned, subject, reason: "No teacher for subject" });
          return;
        }

        const teacher = pool[classIndex % pool.length];
        newAllocations.push({
          teacher: teacher._id,
          classAssigned,
          subject,
        });
        existingKeys.add(key);
      });
    });

    let createdCount = 0;
    if (newAllocations.length > 0) {
      const created = await TeacherAllocation.insertMany(newAllocations, { ordered: false });
      createdCount = created.length;
    }

    const coverage = await buildCoverageGrid();

    res.status(200).json({
      msg: "Auto allocation completed",
      createdAllocations: createdCount,
      unresolved,
      coverage,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Duplicate allocation detected while creating" });
    }
    res.status(500).json({ msg: "Server error" });
  }
};

export const createTeacherAllocation = async (req, res) => {
  try {
    const { teacherId, classAssigned, subject } = req.body;

    if (!teacherId || !classAssigned || !subject) {
      return res.status(400).json({ msg: "teacherId, classAssigned and subject are required" });
    }

    const resolvedClass = normalizeClass(classAssigned);
    if (!ALLOWED_CLASSES.includes(resolvedClass)) {
      return res.status(400).json({ msg: "Invalid class. Allowed: 8-A to 10-D" });
    }

    const resolvedSubject = normalizeSubject(subject);
    if (!resolvedSubject) {
      return res.status(400).json({ msg: "Subject is required" });
    }
    if (!TEACHER_SUBJECTS.includes(resolvedSubject)) {
      return res.status(400).json({ msg: `Subject must be one of: ${TEACHER_SUBJECTS.join(", ")}` });
    }

    const teacher = await User.findById(teacherId).select("role name email");
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    const allocation = await TeacherAllocation.create({
      teacher: teacher._id,
      classAssigned: resolvedClass,
      subject: resolvedSubject,
    });

    res.status(201).json({
      msg: "Teacher allocation created",
      allocation: {
        id: allocation._id,
        classAssigned: allocation.classAssigned,
        subject: allocation.subject,
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "Allocation already exists for this teacher, class and subject" });
    }

    res.status(500).json({ msg: "Server error" });
  }
};

export const deleteTeacherAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await TeacherAllocation.findByIdAndDelete(id);
    if (!allocation) {
      return res.status(404).json({ msg: "Allocation not found" });
    }

    res.status(200).json({ msg: "Allocation removed" });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const getMyTeachingClasses = async (req, res) => {
  try {
    const allocations = await TeacherAllocation.find({ teacher: req.user.id })
      .select("classAssigned subject")
      .sort({ classAssigned: 1, subject: 1 });

    const classMap = new Map();
    allocations.forEach((row) => {
      const key = row.classAssigned;
      if (!classMap.has(key)) {
        classMap.set(key, new Set());
      }
      classMap.get(key).add(row.subject);
    });

    const classNames = Array.from(classMap.keys());

    const countPairs = await Promise.all(
      classNames.map(async (classAssigned) => {
        const studentsCount = await User.countDocuments({ role: "student", classAssigned });
        return { classAssigned, studentsCount };
      }),
    );

    const countMap = new Map(countPairs.map((x) => [x.classAssigned, x.studentsCount]));

    const items = classNames.map((classAssigned) => ({
      classAssigned,
      subjects: Array.from(classMap.get(classAssigned)).sort((a, b) => a.localeCompare(b)),
      studentsCount: countMap.get(classAssigned) || 0,
    }));

    res.status(200).json({ count: items.length, items });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

export const getMyClassStudents = async (req, res) => {
  try {
    const classAssigned = normalizeClass(req.params.classAssigned);

    if (!ALLOWED_CLASSES.includes(classAssigned)) {
      return res.status(400).json({ msg: "Invalid class" });
    }

    const allocations = await TeacherAllocation.find({
      teacher: req.user.id,
      classAssigned,
    }).select("subject");

    if (allocations.length === 0) {
      return res.status(403).json({ msg: "You are not allocated to this class" });
    }

    const students = await User.find({ role: "student", classAssigned })
      .select("name email classAssigned rollNumber")
      .sort({ name: 1 });

    // Ensure roll numbers exist for all students in this class
    for (const student of students) {
      if (!student.rollNumber) {
        await ensureRollNumberForStudent(student);
      }
    }

    const subjects = Array.from(new Set(allocations.map((a) => a.subject))).sort((a, b) =>
      a.localeCompare(b),
    );

    const studentIds = students.map((s) => s._id);

    // Attendance percentage per student
    const attendanceAgg = await Attendance.aggregate([
      { $match: { classAssigned, student: { $in: studentIds } } },
      {
        $group: {
          _id: "$student",
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0],
            },
          },
        },
      },
    ]);
    const attendanceMap = new Map(
      attendanceAgg.map((row) => [
        String(row._id),
        row.total === 0 ? 0 : Number(((row.present / row.total) * 100).toFixed(2)),
      ]),
    );

    // Subject-wise average marks per student (percentage)
    let subjectAverageMap = new Map();
    if (studentIds.length > 0 && subjects.length > 0) {
      const marksAgg = await Marks.aggregate([
        { $match: { classAssigned, student: { $in: studentIds }, subject: { $in: subjects } } },
        {
          $group: {
            _id: { student: "$student", subject: "$subject" },
            totalObtained: { $sum: "$marksObtained" },
            totalMax: { $sum: "$maxMarks" },
          },
        },
      ]);

      subjectAverageMap = new Map();
      marksAgg.forEach((row) => {
        const studentId = String(row._id.student);
        const subject = row._id.subject;
        const percent =
          row.totalMax === 0 ? 0 : Number(((row.totalObtained / row.totalMax) * 100).toFixed(2));
        if (!subjectAverageMap.has(studentId)) {
          subjectAverageMap.set(studentId, {});
        }
        subjectAverageMap.get(studentId)[subject] = percent;
      });
    }

    // Assignment submission rate per student for class assignments
    const classAssignments = await Assignment.find({ classAssigned }).select("_id");
    const assignmentIds = classAssignments.map((a) => a._id);

    let submissionMap = new Map();
    if (assignmentIds.length > 0) {
      const submissionAgg = await Submission.aggregate([
        { $match: { assignment: { $in: assignmentIds }, student: { $in: studentIds } } },
        { $group: { _id: "$student", submitted: { $addToSet: "$assignment" } } },
      ]);
      submissionMap = new Map(
        submissionAgg.map((row) => [String(row._id), row.submitted.length]),
      );
    }

    const totalAssignmentsCount = assignmentIds.length;

    const items = students.map((student) => {
      const att = attendanceMap.get(String(student._id)) ?? 0;
      const submittedCount = submissionMap.get(String(student._id)) || 0;
      const submissionRate =
        totalAssignmentsCount === 0
          ? 0
          : Number(((submittedCount / totalAssignmentsCount) * 100).toFixed(2));
      const subjectAverages = subjectAverageMap.get(String(student._id)) || {};

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        classAssigned: student.classAssigned,
        rollNumber: student.rollNumber || null,
        attendancePercentage: att,
        submissionRate,
        subjectAverages,
      };
    });

    res.status(200).json({
      classAssigned,
      subjects,
      count: items.length,
      items,
    });
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
};

