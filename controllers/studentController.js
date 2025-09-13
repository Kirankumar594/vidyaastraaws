const Student = require("../models/Student");
const Class = require("../models/Class");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const School = require("../models/School");
const { default: mongoose } = require("mongoose");
const { uploadFile2 } = require("../config/AWS");

// FIXED: Get Student Profile - Updated to include section information
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("classId", "className section classTeacher") // FIXED: Added 'section' and 'classTeacher'
      .populate("schoolId", "name");

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FIXED: Update Student Profile - Updated to include section information
exports.updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;
    let updateFields = { ...req.body };

    // ✅ Handle password update safely
    if (updateFields.password && updateFields.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(updateFields.password, salt);
    } else {await
      // prevent overwriting with empty string
      delete updateFields.password;
    }


     if(req.file){
        updateFields.profileImage =await uploadFile2(req.file,"students");
     }
  

    // ✅ Perform update
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate("classId", "className section classTeacher")
      .populate("schoolId");

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    console.log(updatedStudent, "updatedStudent");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map(
        (key) => error.errors[key].message
      );
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// FIXED: Get All Students - Updated to include section information
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("classId", "className section classTeacher")
      .populate("schoolId")
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FIXED: Get Students by School ID - Updated to include section information
exports.getStudentsBySchoolId = async (req, res) => {
  try {
    const { schoolId } = req.params;
    let { page = 1, limit = 10 } = req.query; // default: page 1, limit 10

    page = parseInt(page);
    limit = parseInt(limit);

    const totalStudents = await Student.countDocuments({ schoolId });

    const students = await Student.find({ schoolId })
      .populate("classId", "className section classTeacher")
      .populate("schoolId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: students.length,
      totalStudents,
      totalPages: Math.ceil(totalStudents / limit),
      currentPage: page,
      data: students,
    });
  } catch (error) {
    console.error("Get students by school ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// NEW: Get Class Details - Separate endpoint for fetching complete class information
exports.getClassDetails = async (req, res) => {
  try {
    const { schoolId, classId } = req.params;

    if (!classId) {
      return res
        .status(400)
        .json({ success: false, message: "Class ID is required." });
    }

    const classData = await Class.findById(classId);

    if (!classData) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found." });
    }

    // ✅ Verify school access
    if (schoolId && classData.schoolId.toString() !== schoolId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Get class details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Keep all other methods unchanged
exports.createStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ message: "Missing form data in request body" });
    }

    const {
      name,
      classId,
      rollNumber,
      studentId,
      dob,
      gender,
      address,
      phone,
      email,
      password,
      fatherName,
      motherName,
      parentPhone,
      schoolId,
    } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for student creation.",
      });
    }

    // Validate schoolId and check student limit
    const school = await School.findById(schoolId).session(session);
    if (!school) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    // If no seats left
    if (school.totalStudent <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot add more students. The school has no available seats left.`,
      });
    }

    const existingStudent = await Student.findOne({
    rollNumber,
    }).session(session);
    if (existingStudent) {
      await session.abortTransaction(); 
      return res.status(400).json({
        success: false,
        message: "A student roll number already exists.",
      });
    } 
    const existingStudentId = await Student.findOne({
      studentId,
    }).session(session);
    if (existingStudentId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "A student ID already exists.",
      });
    }

    const exiztingPhone = await Student.findOne({
      phone,
    }).session(session);  
    if (exiztingPhone) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "A student phone number already exists.",
      });
    }

    const existingEmail = await Student.findOne({
      email,
    }).session(session);  
    if (existingEmail) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "A student email already exists.",
      });
    }


    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle profile image upload
    let profileImagePath = "";
    if (req.file) {
      try {
        profileImagePath = await uploadFile2(req.file,"students");
      } catch (fileError) {
        console.error("File upload error:", fileError);
      }
    }

    // Create new student
    const newStudent = new Student({
      name,
      classId,
      rollNumber,
      studentId,
      dob,
      gender,
      address,
      phone,
      email,
      password: hashedPassword,
      fatherName,
      motherName,
      parentPhone,
      schoolId,
      profileImage: profileImagePath,
    });

    // Save student with session
    await newStudent.save({ session });

    // Decrease available seats (totalStudent) by 1
    await School.findByIdAndUpdate(
      schoolId,
      { $inc: { totalStudent: -1 } },
      { session, new: true }
    );

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create student error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map(
        (key) => error.errors[key].message
      );
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
      });
    }

    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  } finally {
    session.endSession(); // always close session
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Please upload a file" });

    const tempPath = req.file.path;
    const fileName = req.file.filename;
    const permanentDir = path.join(__dirname, "../uploads/profiles");

    if (!fs.existsSync(permanentDir)) {
      fs.mkdirSync(permanentDir, { recursive: true });
    }

    const permanentPath = path.join(permanentDir, fileName);
    fs.renameSync(tempPath, permanentPath);

    if (student.profileImage) {
      const oldImagePath = path.join(__dirname, "..", student.profileImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    const newProfileImage = `/uploads/profiles/${fileName}`;

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: { profileImage: newProfileImage } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      filePath: updatedStudent.profileImage,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Upload profile image error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.deleteProfileImage = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (student.profileImage) {
      const imagePath = path.join(__dirname, "..", student.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    student.profileImage = "";
    await student.save();

    res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
      student,
    });
  } catch (error) {
    console.error("Delete profile image error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { studentId } = req.params;
    const { id } = req.params; // studentId from URL
    const { schoolId } = req.body; // schoolId from body
    console.log("Delete student request:", { id, schoolId });
    console.log("Delete student request:", { studentId, schoolId });

    // Validate required fields
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Student ID is required in URL." });
    }

    if (!schoolId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "School ID is required in body." });
    }

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(schoolId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID or School ID format.",
      });
    }

    // Find student
    const student = await Student.findOne({ _id: id, schoolId }).session(
      session
    );
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Student not found or does not belong to this school",
      });
    }

    // Delete profile image if exists
    if (student.profileImage) {
      const imagePath = path.join(__dirname, "..", student.profileImage);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (fileError) {
          console.error("Error deleting profile image:", fileError);
        }
      }
    }

    // Delete student
    await Student.deleteOne({ _id: id, schoolId }).session(session);

    // Decrement school's current student count
    const school = await School.findByIdAndUpdate(
      schoolId,
      {
        $inc: {
          currentStudentCount: -1, // one student less currently
          totalStudent: 1, // one more added to total history
        },
      },
      { session, new: true }
    );

    if (!school) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      school,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete student error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
// Get Students by Class Name
exports.getStudentsByClassName = async (req, res) => {
  try {
    const { className } = req.params;
    if (!className) {
      return res.status(400).json({
        success: false,
        message: "Class name is required in URL.",
      });
    }

    // Find the class by name
    const classData = await Class.findOne({ className });
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found with this name.",
      });
    }

    // Find students belonging to this class
    const students = await Student.find({ classId: classData._id })
      .populate("classId", "className section classTeacher")
      .populate("schoolId", "name")
      .sort({ createdAt: -1 });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No students found in class ${className}.`,
      });
    }

    res.status(200).json({
      success: true,
      count: students.length,
      class: classData.className,
      data: students,
    });
  } catch (error) {
    console.error("Get students by class name error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
