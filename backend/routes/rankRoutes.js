import express from "express";
import protect from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { getRank } from "../controllers/rankController.js";

const router = express.Router();

router.get(
    "/:classAssigned/:examName",
    protect,
    authorizeRoles("student"),
    getRank,
);

export default router;