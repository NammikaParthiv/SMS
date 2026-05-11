import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { deleteMyNotification, getMyNotifications, markNotificationRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/mine", protect, authorizeRoles("student", "admin", "teacher"), getMyNotifications);
router.patch("/:id/read", protect, authorizeRoles("student", "admin", "teacher"), markNotificationRead);
router.delete("/:id", protect, authorizeRoles("student", "admin", "teacher"), deleteMyNotification);

export default router;
