const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");

router.get("/all-unfiltered", teacherController.getAllTeachersUnfiltered);

router.get("/", teacherController.getAllTeachers);

router.get("/:id", teacherController.getTeacher);
router.post("/", teacherController.createTeacher);
router.put("/:id", teacherController.updateTeacher);
router.delete("/:id", teacherController.deleteTeacher);

module.exports = router;
