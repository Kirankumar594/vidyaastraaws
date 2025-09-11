        const mongoose = require("mongoose");

        const teacherLoginSchema = new mongoose.Schema(
          {
            name: {
              type: String,
              required: true,
            },

            // Store subject names directly
            subjects: [
              {
                type: String,
                required: true,
              },
            ],

            profilePic: {
              type: String,
              default: "",
            },

            // Store class names directly (teaching multiple classes)
            classes: [
              {
                type: String,
                required: true,
              },
            ],

            // New field: Class Teacher assignment (reference to Class collection)
            classTeacherOf: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Class",
              default: null,
            },

            phone: {
              type: String,
              required: true,
              unique: true,
              match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"],
            },

            createdAt: {
              type: Date,
              default: Date.now,
            },

            schoolId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "School",
              required: true,
            },

            email: {
              type: String,
              required: true,
              unique: true,
              lowercase: true,
            },

            password: {
              type: String,
              required: true,
            },
          },
          { timestamps: true }
        );

        module.exports = mongoose.model("TeacherLogin", teacherLoginSchema);
