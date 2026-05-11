import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { generateReportCard } from "../controllers/reportCardController.js";

const router = express.Router();

router.get(
  "/:studentId",
  protect,
  authorizeRoles("student", "teacher", "admin"),
  generateReportCard,
);

router.get(
  "/:studentId/:examName",
  protect,
  authorizeRoles("student", "teacher", "admin"),
  generateReportCard,
);

export default router;
