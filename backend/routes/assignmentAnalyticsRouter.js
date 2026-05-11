import express from "express"
import authorizeRoles from "../middlewares/roleMiddleware.js";
import protect from "../middlewares/authMiddleware.js";
import { getAssignmentStatus } from "../controllers/assignmentAnalyticsController.js";

const router = express.Router();

router.get(
    "/:assignmentId/status",
    protect,
    authorizeRoles("teacher"),
    getAssignmentStatus,
);
export default router;