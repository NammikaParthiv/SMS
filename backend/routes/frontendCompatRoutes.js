import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import uploadAssignment from "../middlewares/uploadAssignment.js";
import uploadProfilePhoto from "../middlewares/uploadProfilePhoto.js";
import {
  createAssignmet,
  extendAssignmentDueDate,
  getTeacherAssignments,
  getAssignmentSubmissionsForTeacher,
} from "../controllers/assignmentController.js";
import {
  getAllStudents,
  getAllTeachers,
  getStudentById,
  getStudentDashboard,
  updateStudentPhoto,
} from "../controllers/studentController.js";
import { generateReportCard } from "../controllers/reportCardController.js";
import { getAllowedClasses } from "../controllers/metaController.js";

const router = express.Router();

router.get("/students", protect, authorizeRoles("admin", "teacher"), getAllStudents);
router.get(
  "/students/:id",
  protect,
  authorizeRoles("admin", "teacher", "student"),
  getStudentById,
);
router.patch(
  "/students/:id/photo",
  protect,
  authorizeRoles("admin", "student"),
  uploadProfilePhoto.single("photo"),
  updateStudentPhoto,
);
router.get("/teachers", protect, authorizeRoles("admin"), getAllTeachers);

// Public so login/register can load class options before auth
router.get("/classes", getAllowedClasses);

router.post(
  "/teacher/assignments",
  protect,
  authorizeRoles("teacher"),
  uploadAssignment.single("file"),
  createAssignmet,
);

router.get(
  "/teacher/assignments",
  protect,
  authorizeRoles("teacher"),
  getTeacherAssignments,
);

router.patch(
  "/teacher/assignments/:assignmentId/due-date",
  protect,
  authorizeRoles("teacher"),
  extendAssignmentDueDate,
);

router.get(
  "/teacher/assignments/:assignmentId/submissions",
  protect,
  authorizeRoles("teacher"),
  getAssignmentSubmissionsForTeacher,
);

router.get("/student/dashboard", protect, authorizeRoles("student"), getStudentDashboard);

// Public alias for current frontend download button (window.open cannot send Bearer headers)
router.get("/student/report-card/:studentId", generateReportCard);

export default router;
