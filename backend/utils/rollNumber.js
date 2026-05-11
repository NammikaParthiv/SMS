import User from "../models/User.js";

const extractRollNumberDigits = (rollNumber) => {
  if (!rollNumber) return null;
  const digitGroups = String(rollNumber).match(/\d+/g);//using the regex...
  if (!digitGroups || digitGroups.length === 0) return null;
  const lastGroup = Number(digitGroups[digitGroups.length - 1]);
  return Number.isFinite(lastGroup) ? lastGroup : null;
};

const normalizeClassKey = (value) => String(value || "").trim().toUpperCase();

export const getNextRollNumber = async (classAssigned) => {
  const classKey = normalizeClassKey(classAssigned);
  if (!classKey) return null;

  const classmates = await User.find({
    role: "student",
    classAssigned: { $regex: new RegExp(`^${classKey}$`, "i") }, // case-insensitive to handle legacy data
    rollNumber: { $ne: null },
  })
    .select("rollNumber")
    .lean();

  const maxRoll = classmates.reduce((max, student) => {
    const value = extractRollNumberDigits(student.rollNumber);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return `${classKey}-${maxRoll + 1}`;
};

export const ensureRollNumberForStudent = async (studentDoc) => {
  if (!studentDoc || studentDoc.role !== "student") return studentDoc?.rollNumber || null;
  if (studentDoc.rollNumber || !studentDoc.classAssigned) return studentDoc.rollNumber || null;

  const nextRoll = await getNextRollNumber(studentDoc.classAssigned);
  studentDoc.rollNumber = nextRoll;
  await studentDoc.save();
  return nextRoll;
};
