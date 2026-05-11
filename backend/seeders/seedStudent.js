import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Attendence from "../models/Attendence.js";
import Marks from "../models/Marks.js";
import Submission from "../models/Submission.js";
import Notification from "../models/Notification.js";
import { faker } from "@faker-js/faker";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/school-management";

const seedStudents = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const passwordHash = await bcrypt.hash("123456", 10);

    const classes = [
      { name: "8-A", code: "01" },
      { name: "8-B", code: "02" },
      { name: "8-C", code: "03" },
      { name: "8-D", code: "04" },
      { name: "9-A", code: "05" },
      { name: "9-B", code: "06" },
      { name: "9-C", code: "07" },
      { name: "9-D", code: "08" },
      { name: "10-A", code: "09" },
      { name: "10-B", code: "10" },
      { name: "10-C", code: "11" },
      { name: "10-D", code: "12" },
    ];

    const YEAR_PREFIX = "26";
    let emailCounter = 1;
    const users = [];

    await Promise.all([
      User.deleteMany({ role: "student" }),
      Attendence.deleteMany({}),
      Marks.deleteMany({}),
      Submission.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    for (const cls of classes) {
      for (let i = 1; i <= 30; i++) {
        const rollNumber = `${YEAR_PREFIX}${cls.code}${String(i).padStart(2, "0")}`;

        users.push({
          name: faker.person.fullName(),
          email: `student${emailCounter}@gmail.com`,
          password: passwordHash,
          role: "student",
          classAssigned: cls.name,
          rollNumber,
          approvalStatus: "approved",
        });

        emailCounter++;
      }
    }

    await User.insertMany(users);

    console.log("Students created successfully");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedStudents();
