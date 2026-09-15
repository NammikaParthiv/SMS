import PDFDocument from "pdfkit";
import Assignment from "../models/Assignment.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ensureSpace = (doc, requiredHeight = 60) => {
  if (doc.y + requiredHeight > doc.page.height - 55) {
    doc.addPage();
  }
};

const drawSchoolHeader = (doc) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;
  doc.roundedRect(left, y, width, 74, 8).fill("#0f2b46");
  doc.circle(left + 35, y + 37, 20).fill("#ffffff");
  doc.fillColor("#0f2b46").font("Helvetica-Bold").fontSize(15).text("PS", left + 24, y + 31, { width: 22, align: "center" });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(19).text("PYRAMID SCHOOL", left + 68, y + 18);
  doc.fillColor("#bfdbfe").font("Helvetica").fontSize(9).text("STUDENT ACADEMIC REPORT", left + 69, y + 45);
  doc.fillColor("#dbeafe").font("Helvetica").fontSize(8).text(`ISSUED ${formatDate(new Date()).toUpperCase()}`, left + width - 132, y + 33, { width: 116, align: "right" });
  doc.y = y + 92;
};

const drawSectionHeader = (doc, label) => {
  ensureSpace(doc, 32);
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;

  doc.save();
  doc.roundedRect(left, y, width, 24, 6).fill("#e0e7ff");
  doc.fillColor("#3730a3").font("Helvetica-Bold").fontSize(10).text(label.toUpperCase(), left + 10, y + 7);
  doc.restore();

  doc.y = y + 28;
};

const drawPageFrame = (doc) => {
  doc.save();
  doc.rect(22, 22, doc.page.width - 44, doc.page.height - 44)
    .lineWidth(1)
    .strokeColor("#cbd5e1")
    .stroke();
  doc.rect(27, 27, doc.page.width - 54, doc.page.height - 54)
    .lineWidth(0.6)
    .strokeColor("#c7d2fe")
    .stroke();
  doc.restore();
};

const drawStudentProfile = (doc, { student, classAssigned, attendancePercentage, explicitExamName }) => {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;
  doc.roundedRect(left, y, width, 96, 8).fill("#f8fafc").strokeColor("#dbe4ee").lineWidth(0.8).stroke();

  // Default student portrait: used consistently when no photo is available in the report.
  const avatarX = left + 49;
  const avatarY = y + 48;
  doc.circle(avatarX, avatarY, 31).fill("#dbeafe");
  doc.circle(avatarX, avatarY - 10, 9).fill("#2563eb");
  doc.roundedRect(avatarX - 16, avatarY + 2, 32, 20, 10).fill("#2563eb");

  const infoX = left + 100;
  const rightX = left + 305;
  const label = (text, value, x, rowY) => {
    doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(7.5).text(text.toUpperCase(), x, rowY);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(String(value || "-"), x, rowY + 10, { width: 180 });
  };
  label("Student name", student.name, infoX, y + 18);
  label("Class & roll number", `${classAssigned}  •  ${student.rollNumber || "-"}`, infoX, y + 57);
  label("Email address", student.email, rightX, y + 18);
  label("Assessment", explicitExamName || "Academic progress report", rightX, y + 57);
  doc.y = y + 110;
};

const collectRecentExamSummaries = (marksDocs, explicitExamName) => {
  const summaries = [];
  const map = new Map();

  marksDocs.forEach((mark) => {
    if (explicitExamName && mark.examName !== explicitExamName) {
      return;
    }

    if (!map.has(mark.examName)) {
      if (!explicitExamName && summaries.length >= 5) {
        return;
      }

      const summary = {
        examName: mark.examName,
        subjects: [],
        totalObtained: 0,
        totalMax: 0,
      };

      map.set(mark.examName, summary);
      summaries.push(summary);
    }

    const row = map.get(mark.examName);
    row.subjects.push({
      subject: mark.subject,
      marksObtained: mark.marksObtained,
      maxMarks: mark.maxMarks,
    });
    row.totalObtained += mark.marksObtained;
    row.totalMax += mark.maxMarks;
  });

  return summaries.map((item) => ({
    ...item,
    percentage: item.totalMax ? Number(((item.totalObtained / item.totalMax) * 100).toFixed(2)) : 0,
    subjects: item.subjects.sort((a, b) => a.subject.localeCompare(b.subject)),
  }));
};

const buildReportCardPdf = async ({
  student,
  classAssigned,
  attendancePercentage,
  examSummaries,
  assignmentRows,
  submittedCount,
  explicitExamName,
}) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("error", (error) => reject(error));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("pageAdded", () => drawPageFrame(doc));

  drawPageFrame(doc);

  drawSchoolHeader(doc);
  const headingLeft = doc.page.margins.left;
  const headingWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  // PDFKit retains the previous text X coordinate, so explicitly anchor headings
  // to the full content width to keep them centered on one line.
  doc.fillColor("#0f2b46").font("Helvetica-Bold").fontSize(17).text(
    "ACADEMIC PERFORMANCE REPORT",
    headingLeft,
    doc.y,
    { width: headingWidth, align: "center", lineBreak: false },
  );
  doc.y += 25;
  doc.fillColor("#64748b").font("Helvetica").fontSize(9).text(
    explicitExamName ? `Assessment: ${explicitExamName}` : "Consolidated assessment record",
    headingLeft,
    doc.y,
    { width: headingWidth, align: "center", lineBreak: false },
  );
  doc.moveDown(1.3);

  const left = doc.page.margins.left;
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  drawStudentProfile(doc, { student, classAssigned, attendancePercentage, explicitExamName });

  drawSectionHeader(doc, "Attendance Summary");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(`Attendance record: ${attendancePercentage}%`);
  const attendanceBarY = doc.y + 8;
  const attendanceBarWidth = contentWidth - 112;
  doc.roundedRect(left + 112, attendanceBarY, attendanceBarWidth, 10, 5).fill("#e2e8f0");
  doc.roundedRect(left + 112, attendanceBarY, attendanceBarWidth * Math.min(attendancePercentage, 100) / 100, 10, 5).fill(attendancePercentage >= 75 ? "#10b981" : "#f59e0b");
  doc.y = attendanceBarY + 18;

  doc.moveDown(0.8);

  // Assignment summary above exams
  drawSectionHeader(doc, "Assignment Completion");
  const totalAssignments = assignmentRows.length;
  const submissionRate =
    totalAssignments === 0 ? 0 : Number(((submittedCount / totalAssignments) * 100).toFixed(2));
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text(`Completed assignments: ${submittedCount} of ${totalAssignments} (${submissionRate}%)`);
  doc.moveDown(1);

  drawSectionHeader(doc, "Exam Performance");

  if (examSummaries.length === 0) {
    doc.fillColor("#64748b").font("Helvetica").fontSize(10).text("No exam marks available.");
  } else {
    examSummaries.forEach((exam, examIndex) => {
      ensureSpace(doc, 120 + exam.subjects.length * 18);
      doc.fillColor("#0f2b46").font("Helvetica-Bold").fontSize(12).text(`${examIndex + 1}. ${exam.examName}`, left, doc.y, {
        width: contentWidth,
      });
      doc.moveDown(0.6);

      const rowY = doc.y;
      const col1 = left;
      const col2 = left + 210;
      const col3 = left + 315;
      const col4 = left + 410;

      doc.roundedRect(left, rowY - 4, contentWidth, 19, 4).fill("#0f2b46");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
      doc.text("SUBJECT", col1 + 8, rowY);
      doc.text("MAX", col2, rowY);
      doc.text("SCORED", col3, rowY);
      doc.text("RESULT", col4, rowY);

      doc.y = rowY + 22;
      exam.subjects.forEach((subject, subjectIndex) => {
        const subjectY = doc.y;
        if (subjectIndex % 2 === 0) doc.rect(left, subjectY - 3, contentWidth, 17).fill("#f8fafc");
        const percentage = Number(((subject.marksObtained / subject.maxMarks) * 100).toFixed(1));
        doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9).text(subject.subject.toUpperCase(), col1 + 8, subjectY);
        doc.font("Helvetica").text(String(subject.maxMarks), col2, subjectY);
        doc.text(String(subject.marksObtained), col3, subjectY);
        doc.fillColor(percentage >= 40 ? "#047857" : "#be123c").font("Helvetica-Bold").text(`${percentage}% ${percentage >= 40 ? "PASS" : "NEEDS SUPPORT"}`, col4, subjectY, { width: 105 });
        doc.y = subjectY + 18;
      });

      const totalY = doc.y + 3;
      doc.roundedRect(left, totalY - 3, contentWidth, 20, 4).fill("#e2e8f0");
      doc.fillColor("#0f2b46").font("Helvetica-Bold").fontSize(9.5);
      doc.text(`TOTAL: ${exam.totalObtained} / ${exam.totalMax}`, left + 8, totalY);
      doc.text(`OVERALL: ${exam.percentage}%`, col3, totalY);

      doc.y = totalY + 28;
    });
  }

  doc.moveDown(1.2);
  ensureSpace(doc, 70);
  const signLeft = doc.page.margins.left;
  const signRight = doc.page.width - doc.page.margins.right;
  const signY = doc.y + 24;

  doc.save();
  doc.strokeColor("#94a3b8").lineWidth(1.2);
  doc.moveTo(signLeft, signY).lineTo(signLeft + 180, signY).stroke();
  doc.moveTo(signRight - 180, signY).lineTo(signRight, signY).stroke();
  doc.restore();

  doc.fillColor("#475569").font("Helvetica-Bold").fontSize(9.5);
  doc.text("Class Teacher", signLeft, signY + 8);
  doc.text("Principal", signRight - 180, signY + 8, { width: 180, align: "right" });

  doc.end();
});

export const generateReportCard = async (req, res) => {
  try {
    const { studentId, examName: examNameParam } = req.params;
    const examNameFromQuery = req.query.examName;
    const explicitExamName = String(examNameParam || examNameFromQuery || "").trim() || null;

    // Validate ObjectId early to avoid CastError
    if (!studentId || !studentId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ msg: "Invalid student id" });
    }

    const student = await User.findById(studentId).select("name email role classAssigned rollNumber photo");
    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    const marksDocs = await Marks.find({ student: studentId })
      .sort({ createdAt: -1 })
      .select("examName subject marksObtained maxMarks createdAt");

    const examSummaries = collectRecentExamSummaries(marksDocs, explicitExamName);

    const totalAttendance = await Attendance.countDocuments({ student: studentId });
    const presentAttendance = await Attendance.countDocuments({ student: studentId, status: "present" });
    const attendancePercentage =
      totalAttendance === 0
        ? 0
        : Number(((presentAttendance / totalAttendance) * 100).toFixed(2));

    let assignmentRows = [];
    let submittedCount = 0;

    if (student.classAssigned) {
      const assignments = await Assignment.find({ classAssigned: student.classAssigned })
        .sort({ dueDate: -1 })
        .limit(15)
        .select("title dueDate");

      const assignmentIds = assignments.map((a) => a._id);

      const submissions = await Submission.find({
        student: studentId,
        assignment: { $in: assignmentIds },
      }).select("assignment submittedAt isLate");

      const submissionMap = new Map(submissions.map((s) => [s.assignment.toString(), s]));

      assignmentRows = assignments.map((assignment) => {
        const sub = submissionMap.get(assignment._id.toString());
        const submitted = Boolean(sub);
        if (submitted) submittedCount += 1;

        return {
          title: assignment.title,
          dueDate: assignment.dueDate,
          submitted,
          submittedAt: sub?.submittedAt || null,
          isLate: sub?.isLate || false,
        };
      });
    }

    const pendingCount = Math.max(assignmentRows.length - submittedCount, 0);
    const classAssigned = student.classAssigned || "UNASSIGNED";

    const safeName = student.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student";

    const pdfBuffer = await buildReportCardPdf({
      student,
      classAssigned,
      attendancePercentage,
      totalAttendance,
      presentAttendance,
      examSummaries,
      assignmentRows,
      submittedCount,
      pendingCount,
      explicitExamName,
    });

    if (pdfBuffer && pdfBuffer.length > 0) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${safeName}-report-card.pdf`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.status(200).send(pdfBuffer);
    }

    return res.status(500).json({ msg: "Report generation failed" });
  } catch (error) {
    console.error("Report card error:", error);
    if (!res.headersSent) {
      res.status(500).json({ msg: "Server error" });
    }
    return undefined;
  }
};
