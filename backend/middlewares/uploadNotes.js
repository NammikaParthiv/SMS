import fs from "fs";
import path from "path";
import multer from "multer";

const notesDir = path.join("uploads", "notes");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }
    cb(null, notesDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PNG, JPG, WEBP files are allowed"), false);
  }
};

const uploadNotes = multer({ storage, fileFilter });

export default uploadNotes;
