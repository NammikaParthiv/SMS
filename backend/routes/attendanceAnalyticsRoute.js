import express  from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { getAttendancePercentage } from "../controllers/attendanceAnalyticsController.js";

const router = express.Router();

router.get(
    "/student/:studentId",
    protect,
    authorizeRoles("student"),
    getAttendancePercentage
);

export default router;
