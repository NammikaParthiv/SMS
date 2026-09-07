import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
const accessLogPath = path.join(logsDir, "access.log");

const ensureLogsDir = () => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
};

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    ensureLogsDir();

    const duration = Date.now() - startedAt;
    const line = [
      new Date().toISOString(),
      req.method,
      req.originalUrl,
      res.statusCode,
      `${duration}ms`,
      req.ip || "-",
    ].join(" ");

    fs.appendFile(accessLogPath, `${line}\n`, () => {});
  });

  next();
};

export default requestLogger;
