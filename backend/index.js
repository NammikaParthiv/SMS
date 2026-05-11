import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect2MongoDB from "./config/db.js";
import authRoute from "./routes/authRouter.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import assignmentAnalyticsRoutes from "./routes/assignmentAnalyticsRouter.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import attendanceAnalyticsRoute from "./routes/attendanceAnalyticsRoute.js";
import marksRoutes from "./routes/marksRoutes.js";
import marksAnalysisRoutes from "./routes/marksAnalyticsRoutes.js";
import rankRoute from "./routes/rankRoutes.js";
import reportCardRoute from "./routes/reportCardRoute.js";
import adminDashboardRoute from "./routes/adminDashboardRoute.js";
import studentRoutes from "./routes/studentRoutes.js";
import frontendCompatRoutes from "./routes/frontendCompatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import teacherClassRoutes from "./routes/teacherClassRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 1000;
const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

connect2MongoDB();

app.use("/api/auth", authRoute);
app.use("/api/student", studentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/assignments", assignmentAnalyticsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance", attendanceAnalyticsRoute);
app.use("/api/attendence", attendanceRoutes);
app.use("/api/attendence", attendanceAnalyticsRoute);
app.use("/api/marks", marksRoutes);
app.use("/api/marks", marksAnalysisRoutes);
app.use("/api/rank", rankRoute);
app.use("/api/report-card", reportCardRoute);
app.use("/api/admin", adminDashboardRoute);
app.use("/api/teacher", teacherClassRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notes", noteRoutes);

app.use("/api", frontendCompatRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.listen(PORT, () => {
  console.log(`Server Started at Port:${PORT}`);
});
