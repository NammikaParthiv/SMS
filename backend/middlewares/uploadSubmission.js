import fs from "fs";
import multer from "multer";
import path from "path";

const submissionsDir = path.join("uploads", "submissions");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(submissionsDir)) {
      fs.mkdirSync(submissionsDir, { recursive: true });
    }
    cb(null, submissionsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only pdf or photo formats are allowed!"), false);
  }
};

const uploadSubmission = multer({ storage, fileFilter });

export default uploadSubmission;
