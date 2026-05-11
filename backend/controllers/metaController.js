import { ALLOWED_CLASSES } from "../constants/academicClasses.js";

export const getAllowedClasses = async (req, res) => {
  res.status(200).json({
    classes: ALLOWED_CLASSES,
  });
};
