import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import uploadNotes from "../middlewares/uploadNotes.js";
import {
  createNote,
  getStudentNotes,
  getTeacherClassNotes,
} from "../controllers/noteController.js";

const router = express.Router();

router.post(
  "/teacher",
  protect,
  authorizeRoles("teacher"),
  uploadNotes.single("file"),
  createNote,
);

router.get(
  "/teacher/:classAssigned",
  protect,
  authorizeRoles("teacher"),
  getTeacherClassNotes,
);

router.get(
  "/student/me",
  protect,
  authorizeRoles("student"),
  getStudentNotes,
);

export default router;
