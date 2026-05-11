import express from "express";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import protect from "../middlewares/authMiddleware.js";
import {
  getClassAttendanceForDate,
  getMyAcademicAttendance,
  markAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("teacher"),
  markAttendance,
);

router.get(
  "/class/:classAssigned",
  protect,
  authorizeRoles("teacher"),
  getClassAttendanceForDate,
);

router.get(
  "/student/me",
  protect,
  authorizeRoles("student"),
  getMyAcademicAttendance,
);

export default router;
