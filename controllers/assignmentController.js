const fs = require("fs");
const path = require("path");
const Assignment = require("../models/Assignment");

// Get all assignments for a student
exports.getStudentAssignments = async (req, res) => {
  try {
    const { status, studentId, schoolId } = req.query;

    if (!studentId || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and School ID are required",
      });
    }

    const query = { studentId, schoolId };
    if (status) {
      query.status = status;
    }

    const assignments = await Assignment.find(query)
      .sort({ dueDate: 1 })
      .lean();

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Submit an assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { comments, studentId, schoolId } = req.body;

    if (!studentId || !schoolId) {
      // Clean up uploaded files if any
      if (req.files?.length) {
        req.files.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: "Student ID and School ID are required",
      });
    }

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      studentId,
      schoolId,
    });

    if (!assignment) {
      if (req.files?.length) {
        req.files.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        });
      }
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found or does not belong to this student/school",
      });
    }

    if (assignment.status !== "pending") {
      if (req.files?.length) {
        req.files.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: "Assignment already submitted",
      });
    }

    const currentDate = new Date();
    const isLate = currentDate > assignment.dueDate;

    const attachments = [];
    if (req.files?.length) {
      req.files.forEach((file) => {
        // FIXED: Ensure correct file path format
        const relativePath = path.relative(
          path.join(__dirname, "../"),
          file.path
        );
        const normalizedPath = relativePath.replace(/\\/g, "/"); // Convert Windows paths to URL format

        attachments.push({
          url: `/${normalizedPath}`, // This will create paths like /uploads/assignments/filename.jpg
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
        });

        console.log(`File stored at: ${file.path}`);
        console.log(`URL will be: /${normalizedPath}`);
      });
    }

    assignment.status = isLate ? "late" : "submitted";
    assignment.submittedDate = currentDate;
    assignment.attachments = attachments;
    assignment.studentComments = comments || "";

    await assignment.save();

    res.json({
      success: true,
      message: "Assignment submitted successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    if (req.files?.length) {
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Get submitted assignments for multiple class names
exports.getSubmittedAssignmentsByClasses = async (req, res) => {
  try {
    const { schoolId, classNames, page = 1, limit = 10 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    if (!classNames) {
      return res.status(400).json({
        success: false,
        message: "At least one class name is required",
      });
    }

    // Convert to array (comma-separated input supported)
    const classNameArray = Array.isArray(classNames)
      ? classNames
      : classNames.split(",").map((c) => c.trim());

    const skip = (page - 1) * limit;

    // Parse classNameArray to build queries
    const classQueries = classNameArray.map((c) => {
      const parts = c.split(" ");
      return {
        className: parts[0],
        section: parts[1] || { $exists: false },
      };
    });

    // First, find all classIds for the given classNames and sections
    const classIds = await Assignment.db.model("Class").find({
      schoolId,
      $or: classQueries,
    }).select("_id");

    const classIdArray = classIds.map((cls) => cls._id);

    if (classIdArray.length === 0) {
      return res.json({
        success: true,
        message: "No classes found",
        data: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        },
      });
    }

    // Find student IDs in those classes
    const studentIds = await Assignment.db.model("Student").find({
      classId: { $in: classIdArray },
    }).select("_id");

    const studentIdArray = studentIds.map((s) => s._id);

    // Then, query assignments
    const [submittedAssignments, total] = await Promise.all([
      Assignment.find({
        schoolId,
        status: { $in: ["submitted", "graded", "late"] },
        studentId: { $in: studentIdArray },
      })
        .populate({
          path: "studentId",
          select: "name rollNumber classId",
          populate: {
            path: "classId",
            select: "className section",
          },
        })
        .sort({ submittedDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Assignment.countDocuments({
        schoolId,
        status: { $in: ["submitted", "graded", "late"] },
        studentId: { $in: studentIdArray },
      }),
    ]);

    const formattedAssignments = submittedAssignments.map((assignment) => {
      const formattedAttachments =
        assignment.attachments?.map((attachment) => ({
          ...attachment,
          url: attachment.url.startsWith("/")
            ? attachment.url
            : `/${attachment.url}`,
        })) || [];

      return {
        ...assignment,
        id: assignment._id,
        studentName: assignment.studentId?.name || "Unknown",
        rollNo: assignment.studentId?.rollNumber || "N/A",
        class: assignment.studentId?.classId?.className || "Unknown",
        section: assignment.studentId?.classId?.section || "",
        priority: assignment.priority?.toUpperCase() || "MEDIUM",
        dueDate: assignment.dueDate
          ? assignment.dueDate.toISOString().split("T")[0]
          : null,
        submittedDate: assignment.submittedDate
          ? assignment.submittedDate.toISOString().split("T")[0]
          : null,
        attachments: formattedAttachments,
      };
    });

    res.json({
      success: true,
      message: "Submitted assignments fetched successfully",
      data: formattedAssignments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching submitted assignments by classes:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get submitted assignments for teachers by schoolId
exports.getSubmittedAssignmentsBySchool = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    const skip = (page - 1) * limit;

    // Find submitted assignments with pagination
    const [submittedAssignments, total] = await Promise.all([
      Assignment.find({
        schoolId: schoolId,
        status: { $in: ["submitted", "graded", "late"] },
      })
        .populate("studentId", "name rollNumber classId")
        .populate({
          path: "studentId",
          populate: {
            path: "classId",
            select: "className section",
          },
        })
        .sort({ submittedDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Assignment.countDocuments({
        schoolId: schoolId,
        status: { $in: ["submitted", "graded", "late"] },
      }),
    ]);

    // Format the response
    const formattedAssignments = submittedAssignments.map((assignment) => {
      const formattedAttachments =
        assignment.attachments?.map((attachment) => ({
          ...attachment,
          url: attachment.url.startsWith("/")
            ? attachment.url
            : `/${attachment.url}`,
        })) || [];

      return {
        ...assignment,
        id: assignment._id,
        studentName: assignment.studentId?.name || "Unknown",
        rollNo: assignment.studentId?.rollNumber || "N/A",
        class: assignment.studentId?.classId?.className || "Unknown",
        section: assignment.studentId?.classId?.section || "",
        priority: assignment.priority?.toUpperCase() || "MEDIUM",
        dueDate: assignment.dueDate
          ? assignment.dueDate.toISOString().split("T")[0]
          : null,
        submittedDate: assignment.submittedDate
          ? assignment.submittedDate.toISOString().split("T")[0]
          : null,
        attachments: formattedAttachments,
      };
    });

    res.json({
      success: true,
      message: "Submitted assignments fetched successfully",
      data: formattedAssignments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching submitted assignments:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Create a new assignment
exports.createAssignment = async (req, res) => {
  try {
    const {
      subject,
      title,
      description,
      dueDate,
      priority,
      studentIds,
      schoolId,
    } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one student ID is required.",
      });
    }

    const assignments = studentIds.map((studentId) => ({
      studentId,
      subject,
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      status: "pending",
      schoolId,
    }));

    const createdAssignments = await Assignment.insertMany(assignments);

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: createdAssignments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { subject, title, description, dueDate, priority, schoolId } =
      req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, schoolId: schoolId },
      {
        subject,
        title,
        description,
        dueDate: new Date(dueDate),
        priority,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or does not belong to this school",
      });
    }

    res.json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Grade an assignment
exports.gradeAssignment = async (req, res) => {
  try {
    const { grade, comments, schoolId } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, schoolId: schoolId },
      {
        grade,
        teacherComments: comments,
        status: "graded",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or does not belong to this school",
      });
    }

    res.json({
      success: true,
      message: "Assignment graded successfully",
      data: assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { schoolId } = req.body;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      schoolId: schoolId,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or does not belong to this school",
      });
    }

    // Clean up associated files
    if (assignment.attachments?.length) {
      assignment.attachments.forEach((attachment) => {
        const filePath = path.join(__dirname, "../", attachment.url);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error deleting attachment file:", err);
        }
      });
    }

    res.json({
      success: true,
      message: "Assignment deleted successfully",
      data: assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get a single assignment
exports.getAssignment = async (req, res) => {
  try {
    const { studentId, schoolId } = req.query;

    if (!studentId || !schoolId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and School ID are required",
      });
    }

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      studentId,
      schoolId,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found or does not belong to this student/school",
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getAllAssignment = async (req, res) => {
  try {
    const { schoolId, page = 1, limit = 10 } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Count total assignments for the school
    const totalAssignments = await Assignment.countDocuments({ schoolId });

    // Paginated assignments
    const assignments = await Assignment.find({ schoolId })
      .sort({ createdAt: -1 }) // latest first
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: "Assignments fetched successfully",
      assignments,
      pagination: {
        total: totalAssignments,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalAssignments / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.getAllAssignmentsUnfiltered = async (req, res) => {
  try {
    const assignments = await Assignment.find({}).lean();
    return res.status(200).json({
      message: "All assignments fetched successfully (unfiltered)",
      assignments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
