import fs from "fs";
import path from "path";
import multer from "multer";

const assignmentsDir = path.join("uploads", "assignments");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(assignmentsDir)) {
      fs.mkdirSync(assignmentsDir, { recursive: true });
    }
    cb(null, assignmentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/png", "image/jpeg"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Pdf,Photo types are allowed!"), false);
  }
};

const uploadAssignment = multer({ storage, fileFilter });

export default uploadAssignment;
