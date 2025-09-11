const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

// Import routes
const superAdminRoutes = require("./routes/superAdminRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const birthdayRoutes = require("./routes/birthdayRoutes");
const classworkRoutes = require("./routes/classworkRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const albums = require("./routes/albumRoutes");
const photos = require("./routes/photoRoutes");
const bookRoutes = require("./routes/bookRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uniformRoutes = require("./routes/uniformRoutes");
const attendance = require("./routes/attendanceRoutes");
const fees = require("./routes/feeRoutes");
const timeTableRoutes = require("./routes/timeTableRoutes");
const examRoutes = require("./routes/examRoutes");
const resultRoutes = require("./routes/resultRoutes");
const transportRoutes = require("./routes/transportRoutes");
const circularRoutes = require("./routes/circularRoutes");
const diaryRoutes = require("./routes/diaryRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registerRoutes = require("./routes/registerRoutes");
const authRoutes = require("./routes/authRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const classRoutes = require("./routes/classRoutes");
const packageRoutes = require("./routes/packageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const teacherLoginRoutes = require("./routes/teacherLoginRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const assignmentRoutes = require("./routes/assignmentRoute");
const subject = require("./routes/subjectRoutes");

dotenv.config();
connectDB();

const app = express();

// CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// FIXED: Static file serving - serve uploads directory with proper configuration
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    // Add proper headers for file serving
    setHeaders: (res, filePath) => {
      // Set proper content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
        res.setHeader("Content-Type", `image/${ext.slice(1)}`);
      } else if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
      }
      // Allow cross-origin requests for files
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

// API Routes
app.use("/api/assignments", assignmentRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/birthdays", birthdayRoutes);
app.use("/api/classwork", classworkRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/albums", albums);
app.use("/api/v1/photos", photos);
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uniform", uniformRoutes);
app.use("/api/attendance", attendance);
app.use("/api/fee", fees);
app.use("/api/timetable", timeTableRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/transports", transportRoutes);
app.use("/api/circulars", circularRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/student/register", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/class", classRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/teacher", teacherLoginRoutes);
app.use("/api/subject", subject);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});
 
app.use(express.static(path.join(__dirname, 'build'))); // Change 'build' to your frontend folder if needed

// Redirect all requests to the index.html file

app.get("*", (req, res) => {
  return  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, "uploads")}`);
});
