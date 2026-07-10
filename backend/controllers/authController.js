import User from "../models/User.js";
import Notification from "../models/Notification.js";
import TeacherAllocation from "../models/TeacherAllocation.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { ALLOWED_CLASSES } from "../constants/academicClasses.js";
import { TEACHER_SUBJECTS } from "../constants/teacherOnboarding.js";
import { logSystemEvent } from "../utils/logEvent.js";
import { ensureRollNumberForStudent, getNextRollNumber } from "../utils/rollNumber.js";

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const normalizeClass = (classAssigned) => String(classAssigned || "").trim().toUpperCase();
const normalizeTeacherValue = (value) => String(value || "").trim().toLowerCase();
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getFrontendUrl = (req) =>
  String(process.env.FRONTEND_URL || req.headers.origin || "http://localhost:5173").replace(/\/+$/, "");

const createResetTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const transporter = createResetTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "SMS password reset",
    text: `Hello ${name},\n\nUse this link to reset your SMS password. It expires in 15 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2>Reset your SMS password</h2>
        <p>Hello ${name},</p>
        <p>Use the button below to create a new password. This link expires in 15 minutes.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  return true;
};

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

    const normalizedEmail = normalizeEmail(email);
    const userExist = await User.findOne({ email: normalizedEmail });
    if (userExist) {
      return res.status(400).json({ msg: "User already exist" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
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

    const findUser = await User.findOne({ email: normalizeEmail(email) });
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

export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires");

    const successMessage = "If this email exists, password reset instructions are ready.";
    if (!user) {
      return res.status(200).json({ msg: successMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${getFrontendUrl(req)}/reset-password/${resetToken}`;
    const emailSent = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    await logSystemEvent({
      operator: `system:${user._id}`,
      action: "Password Reset Requested",
      target: user.email,
    });

    return res.status(200).json({
      msg: emailSent ? "Password reset link sent to your email." : successMessage,
      resetUrl: emailSent || process.env.NODE_ENV === "production" ? undefined : resetUrl,
    });
  } catch {
    return res.status(500).json({ msg: "Could not start password reset" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({ msg: "Reset token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ msg: "Reset link is invalid or expired" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await logSystemEvent({
      operator: `system:${user._id}`,
      action: "Password Reset Completed",
      target: user.email,
    });

    return res.status(200).json({ msg: "Password reset successfully. Please login with your new password." });
  } catch {
    return res.status(500).json({ msg: "Could not reset password" });
  }
};
