import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { getMyClassStudents, getMyTeachingClasses } from "../controllers/teacherAllocationController.js";

const router = express.Router();

router.get("/my-classes", protect, authorizeRoles("teacher"), getMyTeachingClasses);
router.get("/my-classes/:classAssigned/students", protect, authorizeRoles("teacher"), getMyClassStudents);

export default router;

