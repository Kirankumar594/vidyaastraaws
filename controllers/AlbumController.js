const Album = require("../models/Album");
const path = require("path");
const fs = require("fs");

// Ensure uploads/albums directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "albums");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadAlbum = async (req, res) => {
  try {
    const { title, date, schoolId } = req.body; // MODIFIED: Get schoolId from body
    const files = req.files;

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    // Validate inputs
    if (!title || !date) {
      return res.status(400).json({ error: "Title and date are required" });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Prepare image data for storage
    const imageData = files.map((file) => ({
      filename: file.filename,
      // Store relative path instead of full system path
      path: `/uploads/albums/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    // Create and save album
    const album = new Album({
      title,
      date,
      images: imageData,
      schoolId, // MODIFIED: Add schoolId
    });

    await album.save();

    res.status(201).json({
      message: "Album uploaded successfully",
      album,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Server error during upload", details: error.message });
  }
};

// GET all albums
exports.getAlbums = async (req, res) => {
  try {
    const { schoolId } = req.query; // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }

    const albums = await Album.find({ schoolId: schoolId }).sort({
      createdAt: -1,
    }); // MODIFIED: Filter by schoolId
    res.status(200).json({ success: true, albums });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET single album by ID
exports.getAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.query; // MODIFIED: Get schoolId from query

    if (!schoolId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "School ID is required in query parameters.",
        });
    }

    const album = await Album.findById({ _id: id, schoolId: schoolId }); // MODIFIED: Find by ID AND schoolId
    if (!album) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Album not found or does not belong to this school",
        });
    }
    res.status(200).json({ success: true, album });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT update album title/date only (not images)
exports.updateAlbum = async (req, res) => {
  try {
    const { title, date, schoolId } = req.body; // MODIFIED: Get schoolId from body

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const album = await Album.findByIdAndUpdate(
      { _id: req.params.id, schoolId: schoolId }, // MODIFIED: Find by ID AND schoolId
      { title, date },
      { new: true, runValidators: true }
    );

    if (!album) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Album not found or does not belong to this school",
        });
    }

    res.status(200).json({ success: true, album });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE album and remove images from disk
exports.deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body; // MODIFIED: Get schoolId from body (or req.query if preferred for DELETE)

    if (!schoolId) {
      return res
        .status(400)
        .json({ success: false, message: "School ID is required." });
    }

    const album = await Album.findById({ _id: id, schoolId: schoolId }); // MODIFIED: Find by ID AND schoolId
    if (!album) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Album not found or does not belong to this school",
        });
    }

    // Remove each file from disk
    album.images.forEach((image) => {
      const filePath = path.join(__dirname, "..", image.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Album.findByIdAndDelete({ _id: id, schoolId: schoolId }); // MODIFIED: Delete by ID AND schoolId
    res
      .status(200)
      .json({ success: true, message: "Album deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllAlbumsUnfiltered = async (req, res) => {
  try {
    const albums = await Album.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, albums });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
