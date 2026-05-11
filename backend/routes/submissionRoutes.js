import express from "express";
import { submitAssignment } from "../controllers/submissionController.js";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import uploadSubmission from "../middlewares/uploadSubmission.js";

const router = express.Router();

router.post(
  "/:assignmentId",
  protect,
  authorizeRoles("student"),
  uploadSubmission.single("file"),
  submitAssignment,
);

export default router;
