import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Attendence from "../models/Attendance.js";
import Marks from "../models/Marks.js";
import Notification from "../models/Notification.js";
import { faker } from "@faker-js/faker";
import TeacherAllocation from "../models/TeacherAllocation.js";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import { TEACHER_SUBJECTS } from "../constants/teacherOnboarding.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/school-management";

const seedTeachers = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const passwordHash = await bcrypt.hash("123456", 10);

    const subjects = TEACHER_SUBJECTS;

    await Promise.all([
      TeacherAllocation.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Attendence.deleteMany({}),
      Marks.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    const teachers = [];
    subjects.forEach((subject, subjectIndex) => {//subjectIndex...
      for (let i = 0; i < 3; i++) {
        const seq = subjectIndex * 3 + i + 1;
        teachers.push({
          name: faker.person.fullName(),
          email: `teacher${seq}@gmail.com`,
          password: passwordHash,
          role: "teacher",
          teacherSubject: subject,
          approvalStatus: "approved",
        });
      }
    });

    const createdTeachers = await User.insertMany(teachers);

    // distribute each subject's teachers evenly across classes
    //...
    const teacherBySubject = subjects.reduce((acc, subject) => {
      acc[subject] = createdTeachers.filter(
        (t) => String(t.teacherSubject).toLowerCase() === subject,
      );
      return acc;
    }, {});

    const allocations = [];
    ALLOWED_CLASSES.forEach((classAssigned, classIndex) => {
      subjects.forEach((subject) => {
        const pool = teacherBySubject[subject];
        if (!pool || pool.length === 0) return;
        const teacher = pool[classIndex % pool.length];
        allocations.push({
          teacher: teacher._id,
          classAssigned,
          subject,
        });
      });
    });
     //...
    if (allocations.length > 0) {
      await TeacherAllocation.insertMany(allocations, { ordered: false });
    }

    console.log("Teachers and allocations created successfully");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedTeachers();
