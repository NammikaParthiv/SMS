import express from "express";
import {
  getAllStudents,
  getAllTeachers,
  getStudentById,
  getStudentDashboard,
} from "../controllers/studentController.js";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get(
  "/students",
  protect,
  authorizeRoles("admin", "teacher"),
  getAllStudents,
);

router.get(
  "/teachers",
  protect,
  authorizeRoles("admin"),
  getAllTeachers,
);

router.get(
  "/students/:id",
  protect,
  authorizeRoles("admin", "teacher", "student"),
  getStudentById,
);

router.get(
  "/dashboard",
  protect,
  authorizeRoles("student"),
  getStudentDashboard,
);

export default router;
