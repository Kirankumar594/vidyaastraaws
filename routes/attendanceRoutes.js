const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

router.get("/all-unfiltered", attendanceController.getAllAttendanceUnfiltered);

router.post("/", attendanceController.createAttendance);
router.get("/", attendanceController.getAllAttendance);
router.get("/student/:studentId", attendanceController.getAttendanceByStudent);
router.put("/:id", attendanceController.updateAttendance);
router.delete("/:id", attendanceController.deleteAttendance);

module.exports = router;
