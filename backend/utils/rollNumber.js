import User from "../models/User.js";

const normalizeClassKey = (value) => String(value || "").trim().toUpperCase();

const getAcademicYear = () => String(process.env.ACADEMIC_YEAR || new Date().getFullYear()).slice(-2);

const getClassCode = (classAssigned) => {
  const match = normalizeClassKey(classAssigned).match(/^(\d{1,2})-/);
  return match ? match[1].padStart(2, "0") : null;
};

export const formatAcademicRollNumber = (classAssigned, sequence) => {
  const classCode = getClassCode(classAssigned);
  const safeSequence = Number(sequence);
  if (!classCode || !Number.isInteger(safeSequence) || safeSequence < 1 || safeSequence > 9999) return null;
  // YYCCNNNN: 26 + Class 08 + sequence 0001 = 26080001.
  return `${getAcademicYear()}${classCode}${String(safeSequence).padStart(4, "0")}`;
};

export const getNextRollNumber = async (classAssigned) => {
  const classKey = normalizeClassKey(classAssigned);
  const classCode = getClassCode(classKey);
  if (!classKey || !classCode) return null;

  const classmates = await User.find({
    role: "student",
    classAssigned: { $regex: new RegExp(`^${classKey}$`, "i") }, // case-insensitive to handle legacy data
    rollNumber: { $ne: null },
  })
    .select("rollNumber")
    .lean();

  const prefix = `${getAcademicYear()}${classCode}`;
  const maxRoll = classmates.reduce((max, student) => {
    const roll = String(student.rollNumber || "");
    if (!roll.startsWith(prefix)) return max;
    const value = Number(roll.slice(prefix.length));
    return Number.isInteger(value) ? Math.max(max, value) : max;
  }, 0);

  return formatAcademicRollNumber(classKey, maxRoll + 1);
};

export const ensureRollNumberForStudent = async (studentDoc) => {
  if (!studentDoc || studentDoc.role !== "student") return studentDoc?.rollNumber || null;
  if (studentDoc.rollNumber || !studentDoc.classAssigned) return studentDoc.rollNumber || null;

  const nextRoll = await getNextRollNumber(studentDoc.classAssigned);
  studentDoc.rollNumber = nextRoll;
  await studentDoc.save();
  return nextRoll;
};
