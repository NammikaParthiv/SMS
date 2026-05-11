import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import Assignment from "../models/Assignment.js";
import Attendence from "../models/Attendence.js";
import Log from "../models/Log.js";
import Marks from "../models/Marks.js";
import Notification from "../models/Notification.js";
import Submission from "../models/Submission.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import User from "../models/User.js";

dotenv.config();

const DEFAULT_PASSWORD = "123456";

const buildSeedUsers = () => {
  const admins = [
    { name: "Admin", email: "admin@gmail.com", role: "admin", classAssigned: null, approvalStatus: "approved" },
  ];

  // teacher1-14@gmail.com covering subjects; subjects repeat for coverage
  const subjectCycle = ["maths", "physics", "chemistry", "social", "biology", "english", "hindi"];
  const teachers = Array.from({ length: 14 }).map((_, idx) => {
    const subject = subjectCycle[idx % subjectCycle.length];
    return {
      name: `Teacher ${idx + 1}`,
      email: `teacher${idx + 1}@gmail.com`,
      role: "teacher",
      classAssigned: null,
      teacherSubject: subject,
      approvalStatus: "approved",
    };
  });

  // student1-12@gmail.com across first 12 classes (8-A ... 10-D)
  const students = ALLOWED_CLASSES.slice(0, 12).map((cls, idx) => ({
    name: `Student ${idx + 1}`,
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
      Attendence.deleteMany({}),
      Marks.deleteMany({}),
      TeacherAllocation.deleteMany({}),
      Log.deleteMany({}),
      User.deleteMany({}),
    ]);

    const seedUsers = buildSeedUsers();
    const salt = await bcrypt.genSalt(10);

    const docs = [];
    for (const user of seedUsers) {
      const hashedpassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
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
    console.log("Default password for all users: 123456\n");
    console.log("Admin:");
    console.log("- admin@gmail.com\n");
    console.log("Teachers:");
    seedTeachers.forEach((teacher) => console.log(`- ${teacher.email} (${teacher.teacherSubject})`));
    console.log("\nStudents (one per class 8-A to 10-D):");
    seedStudents.forEach((student) => console.log(`- ${student.email} (${student.classAssigned})`));

    process.exit(0);
  } catch (error) {
    console.error("Reset failed:", error.message);
    process.exit(1);
  }
};

main();

