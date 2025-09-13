const express = require("express")
const router = express.Router()
const assignmentController = require("../controllers/assignmentController")
const multer = require("multer")
const upload = multer()

router.get("/all-unfiltered", assignmentController.getAllAssignmentsUnfiltered)
router.get("/submitted", assignmentController.getSubmittedAssignmentsBySchool)
router.get(
  "/submitted-by-classes",
  assignmentController.getSubmittedAssignmentsByClasses
);
// Student routes
router.get("/", assignmentController.getStudentAssignments)
router.get("/:id", assignmentController.getAssignment)
router.post("/:id/submit", upload.array("attachments", 5), assignmentController.submitAssignment)

// Teacher routes
router.post("/", assignmentController.createAssignment)
router.put("/:id", assignmentController.updateAssignment)
router.post("/:id/grade", assignmentController.gradeAssignment)
router.delete("/:id", assignmentController.deleteAssignment)

module.exports = router
