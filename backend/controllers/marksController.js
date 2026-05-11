import Marks from "../models/Marks.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import User from "../models/User.js";
import { logSystemEvent } from "../utils/logEvent.js";

const normalizeClass = (value) => String(value || "").trim().toUpperCase();
const normalizeSubject = (value) => String(value || "").trim();

const ensureTeacherAllocation = async (teacherId, classAssigned, subject) => {
  if (!teacherId || !classAssigned || !subject) return false;
  const allocation = await TeacherAllocation.findOne({
    teacher: teacherId,
    classAssigned,
    subject,
  }).select("_id");
  return Boolean(allocation);
};

export const addMarks = async (req, res) => {
  try {
    const { classAssigned, subject, maxMarks, marksList, examName, studentId, marks, marksObtained } = req.body;
    const isTeacher = req.user?.role === "teacher";

    // Compatibility mode for single-student payload (teacher upload marks screen)
    if (studentId) {
      const student = await User.findById(studentId).select("classAssigned role");
      if (!student || student.role !== "student") {
        return res.status(404).json({ msg: "Student not found" });
      }

      if (classAssigned && student.classAssigned !== normalizeClass(classAssigned)) {
        return res.status(404).json({ msg: "No student found in this class" });
      }

      const resolvedClassAssigned = normalizeClass(classAssigned || student.classAssigned || "");
      if (!resolvedClassAssigned) {
        return res.status(400).json({ msg: "Class is required" });
      }

      const resolvedExamName = String(examName || "General").trim() || "General";
      const resolvedSubject = normalizeSubject(subject || "");
      if (!resolvedSubject) {
        return res.status(400).json({ msg: "Subject is required" });
      }
      const resolvedMarks = Number(marksObtained ?? marks);
      const resolvedMaxMarks = Number(maxMarks ?? 100);

      if (isTeacher) {
        const isAllocated = await ensureTeacherAllocation(req.user.id, resolvedClassAssigned, resolvedSubject);
        if (!isAllocated) {
          return res.status(403).json({ msg: "You are not allocated to this class and subject" });
        }
      }

      if (Number.isNaN(resolvedMarks) || resolvedMarks < 0) {
        return res.status(400).json({ msg: "Valid marks are required" });
      }

      if (Number.isNaN(resolvedMaxMarks) || resolvedMaxMarks <= 0) {
        return res.status(400).json({ msg: "Valid max marks are required" });
      }

      if (resolvedMarks > resolvedMaxMarks) {
        return res.status(400).json({ msg: "Obtained marks cannot exceed max marks" });
      }

      const markDoc = await Marks.findOneAndUpdate(
        {
          student: studentId,
          examName: resolvedExamName,
          subject: resolvedSubject,
        },
        {
          student: studentId,
          classAssigned: resolvedClassAssigned,
          examName: resolvedExamName,
          subject: resolvedSubject,
          marksObtained: resolvedMarks,
          maxMarks: resolvedMaxMarks,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      await logSystemEvent({
        operator: `${req.user.role}:${req.user.id}`,
        action: "Marks Updated",
        target: `Student ${studentId} | ${markDoc.subject} (${markDoc.examName})`,
      });

      return res.status(200).json({
        msg: "Marks saved successfully",
        mark: markDoc,
      });
    }

    if (!classAssigned || !subject || !Array.isArray(marksList) || marksList.length === 0 || !maxMarks || !examName) {
      return res.status(400).json({ msg: "All details are required" });
    }

    const resolvedClassAssigned = normalizeClass(classAssigned);
    const resolvedSubject = normalizeSubject(subject);

    if (!resolvedClassAssigned || !resolvedSubject) {
      return res.status(400).json({ msg: "All details are required" });
    }

    if (isTeacher) {
      const isAllocated = await ensureTeacherAllocation(req.user.id, resolvedClassAssigned, resolvedSubject);
      if (!isAllocated) {
        return res.status(403).json({ msg: "You are not allocated to this class and subject" });
      }
    }

    const classStudentCount = await User.countDocuments({ role: "student", classAssigned: resolvedClassAssigned });
    if (classStudentCount === 0) {
      return res.status(404).json({ msg: "No student found in this class" });
    }

    const resolvedMaxMarks = Number(maxMarks);
    if (Number.isNaN(resolvedMaxMarks) || resolvedMaxMarks <= 0) {
      return res.status(400).json({ msg: "Valid max marks are required" });
    }

    const cleanedList = marksList
      .filter(
        (item) =>
          item &&
          item.studentId &&
          item.marksObtained !== undefined &&
          item.marksObtained !== null &&
          item.marksObtained !== "",
      )
      .map((item) => ({
        student: item.studentId,
        marksObtained: Number(item.marksObtained),
      }));

    if (cleanedList.length === 0) {
      return res.status(400).json({ msg: "Enter marks for at least one student" });
    }

    const hasInvalidMarks = cleanedList.some(
      (item) =>
        Number.isNaN(item.marksObtained) || item.marksObtained < 0 || item.marksObtained > resolvedMaxMarks,
    );

    if (hasInvalidMarks) {
      return res.status(400).json({ msg: "Each marks value must be between 0 and max marks" });
    }

    const bulkOps = cleanedList.map((item) => ({
      updateOne: {
        filter: { student: item.student, examName, subject: resolvedSubject },
        update: {
          student: item.student,
          classAssigned: resolvedClassAssigned,
          examName,
          subject: resolvedSubject,
          marksObtained: item.marksObtained,
          maxMarks: resolvedMaxMarks,
        },
        upsert: true,
      },
    }));

    await Marks.bulkWrite(bulkOps, { ordered: false });

    await logSystemEvent({
      operator: `${req.user.role}:${req.user.id}`,
      action: "Bulk Marks Upserted",
      target: `Class ${resolvedClassAssigned} | ${resolvedSubject} (${examName})`,
    });

    return res.status(201).json({ msg: "Marks entered successfully" });
  } catch (error) {
    return res.status(500).json({ msg: "Server Error" });
  }
};
