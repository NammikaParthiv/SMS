import Marks from "../models/Marks.js";

export const getStudentMarks = async (req, res) => {
  try {
    const { studentId, examName } = req.params;

    if (!studentId || !examName) {
      return res.status(400).json({
        msg: "Insufficient credentials...",
      });
    }

    const marks = await Marks.find({
      student: studentId,
      examName,
    }).select("subject marksObtained maxMarks");

    if (marks.length === 0) {
      return res.status(404).json({
        msg: "No marks found for this exam",
      });
    }

    const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMaxMarks = marks.reduce((sum, m) => sum + m.maxMarks, 0);
    const percentage = ((totalObtained / totalMaxMarks) * 100).toFixed(2);

    const { grade, status } = getGrades(Number(percentage));

    res.status(200).json({
      examName,
      percentage,
      totalMaxMarks,
      totalObtained,
      subjects: marks,
      grade,
      status,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Server error",
    });
  }
};

export const getStudentExamSummary = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user?.id;
    if (!studentId) {
      return res.status(400).json({ msg: "Student id required" });
    }

    const marks = await Marks.find({ student: studentId }).select("examName subject marksObtained maxMarks");

    if (!marks || marks.length === 0) {
      return res.status(200).json({ exams: [] });
    }

    const map = new Map();
    marks.forEach((m) => {
      if (!map.has(m.examName)) {
        map.set(m.examName, {
          examName: m.examName,
          subjects: [],
          totalObtained: 0,
          totalMax: 0,
        });
      }
      const entry = map.get(m.examName);
      entry.subjects.push({
        subject: m.subject,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
      });
      entry.totalObtained += m.marksObtained;
      entry.totalMax += m.maxMarks;
    });

    const exams = Array.from(map.values())
      .map((e) => ({
        ...e,
        percentage: e.totalMax ? Number(((e.totalObtained / e.totalMax) * 100).toFixed(2)) : 0,
        subjects: e.subjects.sort((a, b) => a.subject.localeCompare(b.subject)),
      }))
      .sort((a, b) => a.examName.localeCompare(b.examName));

    return res.status(200).json({ exams });
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
};
const getGrades = (percentage) => {
  if (percentage >= 85) return { grade: "A", status: "pass" };
  if (percentage >= 75) return { grade: "B", status: "pass" };
  if (percentage >= 60) return { grade: "C", status: "pass" };
  if (percentage >= 50) return { grade: "D", status: "pass" };
  if (percentage >= 35) return { grade: "E", status: "pass" };
  return { grade: "F", status: "fail" };
};
