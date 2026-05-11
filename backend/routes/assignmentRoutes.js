import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import uploadAssignment from "../middlewares/uploadAssignment.js";
import {
  createAssignmet,
  extendAssignmentDueDate,
  getStudentAssignments,
  getTeacherAssignments,
  getAssignmentSubmissionsForTeacher,
} from "../controllers/assignmentController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("teacher"),
  uploadAssignment.single("file"),
  createAssignmet,
);

router.patch(
  "/:assignmentId/due-date",
  protect,
  authorizeRoles("teacher"),
  extendAssignmentDueDate,
);

router.get(
  "/mine",
  protect,
  authorizeRoles("teacher"),
  getTeacherAssignments,
);

router.get(
  "/mine/:assignmentId/submissions",
  protect,
  authorizeRoles("teacher"),
  getAssignmentSubmissionsForTeacher,
);

router.get(
  "/student",
  protect,
  authorizeRoles("student"),
  getStudentAssignments,
);

export default router;
