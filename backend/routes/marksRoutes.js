import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { addMarks } from "../controllers/marksController.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorizeRoles("teacher"),
    addMarks,
);

export default router;