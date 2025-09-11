const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const upload = require("../utils/multer");

router.get("/", studentController.getAllStudents);

router.get("/:id", studentController.getStudentProfile);

router.post(
  "/",
  upload.single("profileImage"),
  studentController.createStudent
);

router.put(
  "/:id",
  upload.single("profileImage"),
  studentController.updateStudentProfile
);

router.post(
  "/:id/profile-image",
  upload.single("profileImage"),
  studentController.uploadProfileImage
);

router.delete("/:id/profile-image", studentController.deleteProfileImage);

router.get("/school/:schoolId", studentController.getStudentsBySchoolId);
router.delete("/student/:id", studentController.deleteStudent);
router.get("/student/:schoolId/:classId", studentController.getClassDetails);
router.get(
  "/class/:className",
  studentController.getStudentsByClassName
);
module.exports = router;
