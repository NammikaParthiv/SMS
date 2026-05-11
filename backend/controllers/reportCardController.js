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

const drawTriangleLogo = (doc, centerX, topY, size = 36) => {
  const half = size / 2;
  const height = size * 0.95;

  doc.save();

  // Base gradient blocks to mimic sidebar logo hues
  doc.fillColor("#e5e7eb").rect(centerX - size, topY + height * 0.65, size * 2, size * 0.14).fill();
  doc.fillColor("#cbd5e1").rect(centerX - size * 0.6, topY + height * 0.72, size * 1.2, size * 0.12).fill();

  // Main pyramid face
  doc.fillColor("#111827").polygon(
    [centerX, topY],
    [centerX - half, topY + height],
    [centerX + half, topY + height],
  ).fill();

  // Highlighted side
  doc.fillColor("#9ca3af").polygon(
    [centerX, topY],
    [centerX + half * 0.72, topY + height * 0.92],
    [centerX + half * 0.12, topY + height * 0.92],
  ).fill();

  // Base shimmer
  doc.fillColor("#e5e7eb").rect(centerX - half, topY + height, size, 3).fill();

  // Apex opening
  doc.fillColor("#f9fafb").circle(centerX, topY + 6, size * 0.12).fill();
  doc.restore();
};

const drawSectionHeader = (doc, label) => {
  ensureSpace(doc, 32);
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;

  doc.save();
  doc.fillColor("#e5e7eb").rect(left, y, width, 22).fill();
  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11).text(label, left + 10, y + 6);
  doc.restore();

  doc.y = y + 28;
};

const drawPageFrame = (doc) => {
  doc.save();
  doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48)
    .lineWidth(1.4)
    .strokeColor("#d1d5db")
    .stroke();
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
    .lineWidth(0.6)
    .strokeColor("#e5e7eb")
    .stroke();
  doc.rect(24, 24, doc.page.width - 48, 80).fill("#f9fafb");
  doc.restore();
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

  const centerX = doc.page.width / 2;
  const headerTop = doc.y;
  drawTriangleLogo(doc, centerX, headerTop, 40);
  doc.y = headerTop + 72;

  // Title block
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(22).text("Progress Report", { align: "center" });
  doc.moveDown(0.1);
  doc.fillColor("#4b5563").font("Helvetica").fontSize(11).text("Academic Report Card", { align: "center" });
  doc.fillColor("#6b7280").fontSize(9).text(`Generated on ${formatDate(new Date())}`, { align: "center" });
  doc.moveDown(1.4);

  drawSectionHeader(doc, "Student Information");

  const left = doc.page.margins.left;
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = (contentWidth - 20) / 2;
  const rowHeight = 18;

  const infoRows = [
    ["Student Name", student.name],
    ["Roll No", student.rollNo || "-"],
    ["Class", classAssigned],
    ["Email", student.email],
    ["Report Type", explicitExamName ? "Single Exam" : "Recent Exams"],
    ["Attendance %", `${attendancePercentage}%`],
  ];

  for (let i = 0; i < infoRows.length; i += 2) {
    ensureSpace(doc, rowHeight + 6);
    const rowY = doc.y;
    const leftItem = infoRows[i];
    const rightItem = infoRows[i + 1];

    doc.fillColor("#334155").font("Helvetica-Bold").fontSize(10).text(leftItem[0], left, rowY, { width: columnWidth });
    doc.fillColor("#0f172a").font("Helvetica").fontSize(10).text(leftItem[1], left + 90, rowY, {
      width: columnWidth - 90,
    });

    if (rightItem) {
      const rightX = left + columnWidth + 20;
      doc.fillColor("#334155").font("Helvetica-Bold").fontSize(10).text(rightItem[0], rightX, rowY, {
        width: columnWidth,
      });
      doc.fillColor("#0f172a").font("Helvetica").fontSize(10).text(rightItem[1], rightX + 90, rowY, {
        width: columnWidth - 90,
      });
    }

    doc.y = rowY + rowHeight;
  }

  doc.moveDown(0.6);

  drawSectionHeader(doc, "Attendance Summary");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(`Attendance: ${attendancePercentage}%`);

  doc.moveDown(0.8);

  // Assignment summary above exams
  drawSectionHeader(doc, "Assignment Submission");
  const totalAssignments = assignmentRows.length;
  const submissionRate =
    totalAssignments === 0 ? 0 : Number(((submittedCount / totalAssignments) * 100).toFixed(2));
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(`Submission Rate: ${submissionRate}%`);
  doc.moveDown(1);

  drawSectionHeader(doc, "Exam Performance");

  if (examSummaries.length === 0) {
    doc.fillColor("#64748b").font("Helvetica").fontSize(10).text("No exam marks available.");
  } else {
    examSummaries.forEach((exam, examIndex) => {
      ensureSpace(doc, 46);
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(`${examIndex + 1}. ${exam.examName}`, left, doc.y, {
        width: contentWidth,
      });
      doc.moveDown(0.6);

      const rowY = doc.y;
      const col1 = left;
      const col2 = left + 180;
      const col3 = left + 360;

      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10);
      doc.text("Max Marks", col1, rowY);
      doc.text("Marks Obtained", col2, rowY);
      doc.text("%", col3, rowY);

      doc.moveDown(0.6);
      doc.fillColor("#0f172a").font("Helvetica").fontSize(11);
      doc.text(`${exam.totalMax}`, col1, doc.y, { width: 160 });
      doc.text(`${exam.totalObtained}`, col2, doc.y, { width: 160 });
      doc.text(`${exam.percentage}%`, col3, doc.y, { width: 80 });

      doc.moveDown(1.3);
    });
  }

  doc.moveDown(1.2);
  ensureSpace(doc, 70);
  const signLeft = doc.page.margins.left;
  const signRight = doc.page.width - doc.page.margins.right;
  const signY = doc.y + 24;

  doc.save();
  doc.strokeColor("#cbd5f5").lineWidth(1.2);
  doc.moveTo(signLeft, signY).lineTo(signLeft + 180, signY).stroke();
  doc.moveTo(signRight - 180, signY).lineTo(signRight, signY).stroke();
  doc.restore();

  doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(9.5);
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

    const student = await User.findById(studentId).select("name email role classAssigned rollNo photo");
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
