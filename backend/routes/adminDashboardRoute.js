import express from "express";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import protect from "../middlewares/authMiddleware.js";
import {
  approveTeacherAccess,
  approveStudentAccess,
  approveAdminAccess,
  rejectAdminAccess,
  deleteClassData,
  deleteStudentAccount,
  deleteTeacherAccount,
  getAdiminController,
  getAssignmentAudit,
  getClassAverageMarks,
  getPendingTeacherApprovals,
  getPendingStudentApprovals,
  getPendingAdminApprovals,
  getSystemLogs,
  searchStudents,
  sendNotificationBroadcast,
} from "../controllers/adminDashboardController.js";
import {
  autoFillAllocations,
  createTeacherAllocation,
  deleteTeacherAllocation,
  getAllocationCoverage,
  getTeacherAllocations,
} from "../controllers/teacherAllocationController.js";

const router = express.Router();

router.get("/dashboard", protect, authorizeRoles("admin"), getAdiminController);
router.get("/assignments", protect, authorizeRoles("admin"), getAssignmentAudit);
router.get("/students/search", protect, authorizeRoles("admin"), searchStudents);

router.get("/teachers/pending", protect, authorizeRoles("admin"), getPendingTeacherApprovals);
router.patch("/teachers/:teacherId/approve", protect, authorizeRoles("admin"), approveTeacherAccess);
router.get("/admins/pending", protect, authorizeRoles("admin"), getPendingAdminApprovals);
router.patch("/admins/:adminId/approve", protect, authorizeRoles("admin"), approveAdminAccess);
router.delete("/admins/:adminId", protect, authorizeRoles("admin"), rejectAdminAccess);
router.delete("/teachers/:teacherId", protect, authorizeRoles("admin"), deleteTeacherAccount);
router.delete("/students/:studentId", protect, authorizeRoles("admin"), deleteStudentAccount);
router.delete("/classes/:classAssigned", protect, authorizeRoles("admin"), deleteClassData);
router.get("/students/pending", protect, authorizeRoles("admin"), getPendingStudentApprovals);
router.patch("/students/:studentId/approve", protect, authorizeRoles("admin"), approveStudentAccess);
router.get("/marks/averages", protect, authorizeRoles("admin"), getClassAverageMarks);
router.post("/notifications/broadcast", protect, authorizeRoles("admin"), sendNotificationBroadcast);

router.get("/allocations", protect, authorizeRoles("admin"), getTeacherAllocations);
router.get("/allocations/coverage", protect, authorizeRoles("admin"), getAllocationCoverage);
router.post("/allocations/auto-fill", protect, authorizeRoles("admin"), autoFillAllocations);
router.post("/allocations", protect, authorizeRoles("admin"), createTeacherAllocation);
router.delete("/allocations/:id", protect, authorizeRoles("admin"), deleteTeacherAllocation);

// kept for backend audit/debug use; removed from frontend navigation
router.get("/logs", protect, authorizeRoles("admin"), getSystemLogs);

export default router;
