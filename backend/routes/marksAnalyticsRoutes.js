import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { getStudentMarks, getStudentExamSummary } from "../controllers/marksAnalyticsController.js";

const router = express.Router();

router.get(
    "/student/:studentId/:examName",
    protect,
    authorizeRoles("student"),
    getStudentMarks
);

router.get(
  "/student/me",
  protect,
  authorizeRoles("student"),
  getStudentExamSummary,
);

router.get(
  "/student/:studentId",
  protect,
  authorizeRoles("student", "teacher", "admin"),
  getStudentExamSummary,
);
export default router;
