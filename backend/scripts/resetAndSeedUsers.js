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
import { formatAcademicRollNumber } from "../utils/rollNumber.js";

dotenv.config();

const DEFAULT_PASSWORD = "123456";
const ADMIN_PASSWORD = "admin@123";
const SUBJECTS = ["maths", "physics", "chemistry", "social", "english", "hindi", "biology"];
const TEACHER_NAMES = [
  "Priya Sharma", "Rahul Verma", "Ananya Iyer", "Vikram Singh", "Neha Patel", "Arjun Nair", "Meera Kapoor",
  "Karan Malhotra", "Sneha Reddy", "Rohan Desai", "Kavya Menon", "Aditya Rao", "Ishita Gupta", "Siddharth Joshi",
  "Pooja Bhat", "Manish Kumar", "Ritu Saini", "Nikhil Jain", "Divya Thomas", "Sanjay Das", "Asha Pillai",
  "Varun Shah", "Komal Arora", "Gaurav Khanna", "Nisha Bose", "Amit Kulkarni", "Shweta Roy", "Deepak Yadav",
];

const STUDENT_FIRST_NAMES = ["Aditi", "Vivaan", "Anika", "Kabir", "Ira", "Reyansh", "Diya", "Arnav", "Myra", "Aarush"];
const STUDENT_LAST_NAMES = ["Sharma", "Patel", "Rao", "Mehta", "Nair", "Gupta", "Menon", "Singh", "Desai", "Reddy", "Joshi", "Kapoor"];

const buildSeedUsers = () => {
  const admins = [
    { name: "Aarav Mehta", email: "admin@gmail.com", role: "admin", classAssigned: null, approvalStatus: "approved" },
  ];

  // Four approved teachers per subject (28 total), using teacher1@gmail.com … teacher28@gmail.com.
  const teachers = SUBJECTS.flatMap((subject, subjectIndex) =>
    Array.from({ length: 4 }, (_, subjectTeacherIndex) => {
      const index = subjectIndex * 4 + subjectTeacherIndex;
      return {
      name: TEACHER_NAMES[index],
      email: `teacher${index + 1}@gmail.com`,
      role: "teacher",
      classAssigned: null,
      teacherSubject: subject,
      approvalStatus: "approved",
      };
    }),
  );

  // Ten approved students in every class, with predictable roll numbers and emails.
  const students = ALLOWED_CLASSES.flatMap((classAssigned, classIndex) =>
    Array.from({ length: 10 }, (_, studentIndex) => {
      const sequence = studentIndex + 1;
      const emailSequence = classIndex * 10 + sequence;
      return {
        name: `${STUDENT_FIRST_NAMES[studentIndex]} ${STUDENT_LAST_NAMES[(classIndex + studentIndex) % STUDENT_LAST_NAMES.length]}`,
        email: `student${emailSequence}@gmail.com`,
        role: "student",
        classAssigned,
        rollNumber: formatAcademicRollNumber(classAssigned, sequence),
        approvalStatus: "approved",
      };
    }),
  );

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

    // Older versions used a globally unique roll number.  The school format is
    // unique within a class, so replace that legacy index with a compound one.
    try {
      await User.collection.dropIndex("rollNumber_1");
    } catch (error) {
      if (error.codeName !== "IndexNotFound" && error.code !== 27) throw error;
    }
    try {
      await User.collection.dropIndex("classAssigned_1_rollNumber_1");
    } catch (error) {
      if (error.codeName !== "IndexNotFound" && error.code !== 27) throw error;
    }
    await User.collection.createIndex(
      { classAssigned: 1, rollNumber: 1 },
      {
        unique: true,
        partialFilterExpression: { rollNumber: { $type: "string" } },
        name: "classAssigned_1_rollNumber_1",
      },
    );

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
    ALLOWED_CLASSES.forEach((classAssigned, classIndex) => {
      SUBJECTS.forEach((subject) => {
        const teachersForSubject = teachersCreated.filter((teacher) => teacher.teacherSubject === subject);
        const teacher = teachersForSubject[classIndex % teachersForSubject.length];
        allocations.push({
          teacher: teacher._id,
          classAssigned,
          subject,
        });
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
    console.log("Teachers (4 per subject, 28 total):");
    seedTeachers.forEach((teacher) => console.log(`- ${teacher.name} <${teacher.email}> (${teacher.teacherSubject})`));
    console.log("\nStudents: student1@gmail.com to student120@gmail.com (10 per class), password 123456.");
    seedStudents.forEach((student) => console.log(`- ${student.name} <${student.email}> (${student.classAssigned}, ${student.rollNumber})`));

    process.exit(0);
  } catch (error) {
    console.error("Reset failed:", error.message);
    process.exit(1);
  }
};

main();
