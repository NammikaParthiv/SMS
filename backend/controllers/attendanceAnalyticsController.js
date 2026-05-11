import Attendance from "../models/Attendance.js";

export const getAttendancePercentage = async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({
      student: studentId,
    });
    if (records.length === 0) {
      return res.status(404).json({
        msg: "No Attendance records have been found",
      });
    }
    const total = records.length;

    //for present days
    const present = records.filter(
      (record) => record.status === "present",
    ).length;

    const percentage = ((present / total) * 100).toFixed(2); //upto 2 decimals

    const below75 = percentage < 75;

    res.status(200).json({
      total,
      present,
      percentage,
      warning: below75
        ? "Attendance is below 75%"
        : `Attendance is :${percentage}%`,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Server Error",
    });
  }
};
