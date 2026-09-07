import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import Assignment from "../models/Assignment.js";
import Attendance from "../models/Attendance.js";
import Log from "../models/Log.js";
import Marks from "../models/Marks.js";
import Notification from "../models/Notification.js";
import Submission from "../models/Submission.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import User from "../models/User.js";

dotenv.config();

const DEFAULT_PASSWORD = "123456";
const ADMIN_PASSWORD = "admin@123";
const TEACHER_NAMES = [
  "Priya Sharma",
  "Rahul Verma",
  "Ananya Iyer",
  "Vikram Singh",
  "Neha Patel",
  "Arjun Nair",
  "Meera Kapoor",
  "Karan Malhotra",
  "Sneha Reddy",
  "Rohan Desai",
  "Kavya Menon",
  "Aditya Rao",
  "Ishita Gupta",
  "Siddharth Joshi",
];

const STUDENT_NAMES = [
  "Aditi Sharma",
  "Vivaan Patel",
  "Anika Rao",
  "Kabir Mehta",
  "Ira Nair",
  "Reyansh Gupta",
  "Diya Menon",
  "Arnav Singh",
  "Myra Desai",
  "Aarush Reddy",
  "Sara Kapoor",
  "Vihaan Joshi",
];

const buildSeedUsers = () => {
  const admins = [
    { name: "Aarav Mehta", email: "admin@gmail.com", role: "admin", classAssigned: null, approvalStatus: "approved" },
  ];

  // teacher1-14@gmail.com covering subjects; subjects repeat for coverage
  const subjectCycle = ["maths", "physics", "chemistry", "social", "biology", "english", "hindi"];
  const teachers = Array.from({ length: 14 }).map((_, idx) => {
    const subject = subjectCycle[idx % subjectCycle.length];
    return {
      name: TEACHER_NAMES[idx],
      email: `teacher${idx + 1}@gmail.com`,
      role: "teacher",
      classAssigned: null,
      teacherSubject: subject,
      approvalStatus: "approved",
    };
  });

  // student1-12@gmail.com across first 12 classes (8-A ... 10-D)
  const students = ALLOWED_CLASSES.slice(0, 12).map((cls, idx) => ({
    name: STUDENT_NAMES[idx],
    email: `student${idx + 1}@gmail.com`,
    role: "student",
    classAssigned: cls,
    approvalStatus: "approved",
  }));

  return [...admins, ...teachers, ...students];
};

const main = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    // Remove dependent academic data first, then users.
    await Promise.all([
      Notification.deleteMany({}),
      Submission.deleteMany({}),
      Assignment.deleteMany({}),
      Attendance.deleteMany({}),
      Marks.deleteMany({}),
      TeacherAllocation.deleteMany({}),
      Log.deleteMany({}),
      User.deleteMany({}),
    ]);

    const seedUsers = buildSeedUsers();
    const salt = await bcrypt.genSalt(10);

    const docs = [];
    for (const user of seedUsers) {
    const userPassword = user.role === "admin" ? ADMIN_PASSWORD : DEFAULT_PASSWORD;
    const hashedpassword = await bcrypt.hash(userPassword, salt);
    docs.push({ ...user, password: hashedpassword });
    }

    const createdUsers = await User.insertMany(docs);

    const teachersCreated = createdUsers.filter((u) => u.role === "teacher");

    const allocations = [];
    const classesToUse = ALLOWED_CLASSES.slice(0, 12);

    classesToUse.forEach((cls, classIdx) => {
      teachersCreated.forEach((teacher, tIdx) => {
        // assign one subject per teacher per two classes to avoid explosion
        if ((classIdx + tIdx) % 2 === 0) {
          allocations.push({
            teacher: teacher._id,
            classAssigned: cls,
            subject: teacher.teacherSubject,
          });
        }
      });
    });

    if (allocations.length > 0) {
      await TeacherAllocation.insertMany(allocations);
    }

    const seedTeachers = seedUsers.filter((u) => u.role === "teacher");
    const seedStudents = seedUsers.filter((u) => u.role === "student");

    console.log("\nReset complete. New users created successfully.\n");
    console.log("Admin password: admin@123");
    console.log("Teacher and student password: 123456\n");
    console.log("Admin:");
    console.log("- Aarav Mehta <admin@gmail.com>\n");
    console.log("Teachers:");
    seedTeachers.forEach((teacher) => console.log(`- ${teacher.name} <${teacher.email}> (${teacher.teacherSubject})`));
    console.log("\nStudents (one per class 8-A to 10-D):");
    seedStudents.forEach((student) => console.log(`- ${student.name} <${student.email}> (${student.classAssigned})`));

    process.exit(0);
  } catch (error) {
    console.error("Reset failed:", error.message);
    process.exit(1);
  }
};

main();
