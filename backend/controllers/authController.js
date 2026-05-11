import User from "../models/User.js";
import Notification from "../models/Notification.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import { TEACHER_SUBJECTS } from "../constants/teacherOnboarding.js";
import { logSystemEvent } from "../utils/logEvent.js";
import { ensureRollNumberForStudent, getNextRollNumber } from "../utils/rollNumber.js";

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const normalizeClass = (classAssigned) => String(classAssigned || "").trim().toUpperCase();
const normalizeTeacherValue = (value) => String(value || "").trim().toLowerCase();

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, classAssigned, teacherSubject } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All details are required" });
    }

    const normalizedRole = normalizeRole(role);
    if (!["admin", "teacher", "student"].includes(normalizedRole)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    let resolvedClassAssigned = null;
    if (normalizedRole === "student") {
      if (!classAssigned) {
        return res.status(400).json({ msg: "Class is required for student registration" });
      }

      resolvedClassAssigned = normalizeClass(classAssigned);
      if (!ALLOWED_CLASSES.includes(resolvedClassAssigned)) {
        return res.status(400).json({ msg: "Invalid class-name" });
      }
    }

    let TeacherSubject = null;
    let ApprovalStatus = "approved";
    let RollNumber = null;

    if (normalizedRole === "teacher") {
      TeacherSubject = normalizeTeacherValue(teacherSubject);

      if (!TeacherSubject || !TEACHER_SUBJECTS.includes(TeacherSubject)) {
        return res.status(400).json({ msg: `Valid subject is required (${TEACHER_SUBJECTS.join(", ")})` });
      }
      ApprovalStatus = "pending";
    }

    if (normalizedRole === "student") {
      ApprovalStatus = "pending";
      RollNumber = await getNextRollNumber(resolvedClassAssigned);
    }

    if (normalizedRole === "admin") {
      ApprovalStatus = "pending";
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ msg: "User already exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedpassword,
      role: normalizedRole,
      classAssigned: resolvedClassAssigned,
      teacherSubject: TeacherSubject,
      approvalStatus: ApprovalStatus,
      rollNumber: RollNumber,
    });

    if (normalizedRole === "teacher") {
      const admins = await User.find({ role: "admin" }).select("_id");
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            student: admin._id,
            classAssigned: "ADMIN",
            type: "system",
            title: "New Teacher Registration",
            message: `${user.name} submitted registration as ${TeacherSubject} teacher. Please allot class and approve access.`,
          })),
        );
      }
    }

    if (normalizedRole === "student") {
      const admins = await User.find({ role: "admin" }).select("_id");
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            student: admin._id,
            classAssigned: "ADMIN",
            type: "system",
            title: "New Student Registration",
            message: `${user.name} submitted registration for class ${resolvedClassAssigned}. Please approve access.`,
          })),
        );
      }
    }

    if (normalizedRole === "admin") {
      const admins = await User.find({ role: "admin", approvalStatus: "approved" }).select("_id");
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            student: admin._id,
            classAssigned: "ADMIN",
            type: "system",
            title: "New Admin Registration",
            message: `${user.name} requested admin access. Please review and approve.`,
          })),
        );
      }
    }

    await logSystemEvent({
      operator: `system:${user._id}`,
      action: "User Registered",
      target: `${user.name} (${user.role})`,
    });

    if (normalizedRole === "teacher") {
      return res.status(201).json({
        msg: "Your info is submitted. Wait for admin allotment and approval.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          classAssigned: user.classAssigned,
          teacherSubject: user.teacherSubject,
          approvalStatus: user.approvalStatus,
          photo: user.photo,
        },
      });
    }

    if (normalizedRole === "student") {
      return res.status(201).json({
        msg: "Your info is submitted. Wait for admin approval.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          classAssigned: user.classAssigned,
          teacherSubject: user.teacherSubject,
          approvalStatus: user.approvalStatus,
          photo: user.photo,
        },
      });
    }

    if (normalizedRole === "admin") {
      return res.status(201).json({
        msg: "Your admin request is submitted. Existing admins must approve before you can access.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus,
          photo: user.photo,
        },
      });
    }

    return res.status(201).json({
      msg: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classAssigned: user.classAssigned,
        teacherSubject: user.teacherSubject,
        approvalStatus: user.approvalStatus,
        photo: user.photo,
      },
    });
  } catch {
    return res.status(500).json({ msg: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, role, classAssigned } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please check the email or password!" });
    }

    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res.status(401).json({ msg: "Invalid Credentials" });
    }

    const selectedRole = normalizeRole(role);
    if (selectedRole && selectedRole !== findUser.role) {
      return res.status(403).json({ msg: "Selected portal does not match this account role" });
    }

    if (selectedRole === "student") {
      if (!classAssigned) {
        return res.status(400).json({ msg: "Please select your class" });
      }

      const normalizedClass = normalizeClass(classAssigned);
      if (findUser.role !== "student" || findUser.classAssigned !== normalizedClass) {
        return res.status(404).json({ msg: "No student found in this class" });
      }

      if (findUser.approvalStatus && findUser.approvalStatus !== "approved") {
        return res.status(403).json({ msg: "Admin didnt gave access to you yet" });
      }
    }

    if (findUser.role === "teacher") {
      if (findUser.approvalStatus && findUser.approvalStatus !== "approved") {
        return res.status(403).json({ msg: "Admin didnt gave access to you yet" });
      }

      const allocationCount = await TeacherAllocation.countDocuments({ teacher: findUser._id });
      if (allocationCount === 0) {
        return res.status(403).json({ msg: "Admin didnt allot class to you yet" });
      }
    }

    if (findUser.role === "admin") {
      if (findUser.approvalStatus && findUser.approvalStatus !== "approved") {
        return res.status(403).json({ msg: "Existing admins have not approved you yet" });
      }
    }

    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid Password!" });
    }

    if (findUser.role === "student") {
      await ensureRollNumberForStudent(findUser);
    }

    const token = jwt.sign({ id: findUser.id, role: findUser.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    await logSystemEvent({
      operator: `${findUser.role}:${findUser._id}`,
      action: "User Login",
      target: findUser.email,
    });

    return res.status(200).json({
      msg: "Login successfully",
      token,
      user: {
        id: findUser._id,
        name: findUser.name,
        email: findUser.email,
        role: findUser.role,
        classAssigned: findUser.classAssigned,
        teacherSubject: findUser.teacherSubject,
        approvalStatus: findUser.approvalStatus,
        photo: findUser.photo,
      },
    });
  } catch {
    return res.status(500).json({ msg: "Error in the Server" });
  }
};
