import Note from "../models/Note.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";

const normalizeClass = (value) => String(value || "").trim().toUpperCase();
const normalizeSubject = (value) => String(value || "").trim();

const groupBySubject = (notes) => {
  const map = new Map();
  notes.forEach((note) => {
    const subject = note.subject;
    if (!map.has(subject)) map.set(subject, []);
    map.get(subject).push(note);
  });

  return Array.from(map.entries()).map(([subject, items]) => ({
    subject,
    notes: items,
  }));
};

export const createNote = async (req, res) => {
  try {
    const { classAssigned, subject, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: "PDF file is required" });
    }

    const resolvedClass = normalizeClass(classAssigned);
    const resolvedSubject = normalizeSubject(subject);

    if (!resolvedClass || !resolvedSubject) {
      return res.status(400).json({ msg: "Class and subject are required" });
    }

    if (!ALLOWED_CLASSES.includes(resolvedClass)) {
      return res.status(400).json({ msg: "Invalid class" });
    }

    const allocation = await TeacherAllocation.findOne({
      teacher: req.user.id,
      classAssigned: resolvedClass,
      subject: resolvedSubject,
    }).select("_id");

    if (!allocation) {
      return res.status(403).json({ msg: "You are not allocated to this class and subject" });
    }

    const normalizedPath = req.file.path.replace(/\\/g, "/");
    const fileUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;
    const fileName = req.file.originalname;
    const safeTitle = String(title || fileName).trim();

    const note = await Note.create({
      classAssigned: resolvedClass,
      subject: resolvedSubject,
      title: safeTitle,
      fileUrl,
      fileName,
      uploadedBy: req.user.id,
    });

    // Notify students of this class about the new note
    try {
      const students = await User.find({ role: "student", classAssigned: resolvedClass }).select("_id");
      if (students.length > 0) {
        const notifications = students.map((student) => ({
          student: student._id,
          classAssigned: resolvedClass,
          type: "note",
          title: "New Class Note",
          message: `${req.user.name || "Teacher"} has added a note for class ${resolvedClass}`,
        }));
        await Notification.insertMany(notifications);
      }
    } catch (err) {
      console.error("Note notification error:", err.message);
    }

    return res.status(201).json({
      msg: "Note uploaded",
      note: {
        id: note._id,
        classAssigned: note.classAssigned,
        subject: note.subject,
        title: note.title,
        fileUrl: note.fileUrl,
        fileName: note.fileName,
        createdAt: note.createdAt,
      },
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getTeacherClassNotes = async (req, res) => {
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

    const allowedSubjects = allocations.map((a) => a.subject);

    const notes = await Note.find({
      classAssigned,
      subject: { $in: allowedSubjects },
      uploadedBy: req.user.id, // only notes uploaded by this teacher
    })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

    const items = notes.map((note) => ({
      id: note._id,
      classAssigned: note.classAssigned,
      subject: note.subject,
      title: note.title,
      fileUrl: note.fileUrl,
      fileName: note.fileName,
      createdAt: note.createdAt,
      uploadedBy: note.uploadedBy?.name || "Teacher",
    }));

    return res.status(200).json({
      classAssigned,
      subjects: allowedSubjects,
      items: groupBySubject(items),
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getStudentNotes = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select("classAssigned role");
    if (!student || student.role !== "student") {
      return res.status(404).json({ msg: "Student not found" });
    }

    const classAssigned = normalizeClass(student.classAssigned);
    if (!classAssigned || !ALLOWED_CLASSES.includes(classAssigned)) {
      return res.status(400).json({ msg: "Class not assigned" });
    }

    const notes = await Note.find({ classAssigned })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 });

    const items = notes.map((note) => ({
      id: note._id,
      classAssigned: note.classAssigned,
      subject: note.subject,
      title: note.title,
      fileUrl: note.fileUrl,
      fileName: note.fileName,
      createdAt: note.createdAt,
      uploadedBy: note.uploadedBy?.name || "Teacher",
    }));

    return res.status(200).json({
      classAssigned,
      items: groupBySubject(items),
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};
