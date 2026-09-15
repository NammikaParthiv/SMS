import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import uploadNotes from "../middlewares/uploadNotes.js";
import {
  createNote,
  deleteNote,
  getStudentNotes,
  getTeacherClassNotes,
  renameNote,
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

router.patch("/teacher/:noteId", protect, authorizeRoles("teacher"), renameNote);
router.delete("/teacher/:noteId", protect, authorizeRoles("teacher"), deleteNote);

router.get(
  "/student/me",
  protect,
  authorizeRoles("student"),
  getStudentNotes,
);

export default router;
