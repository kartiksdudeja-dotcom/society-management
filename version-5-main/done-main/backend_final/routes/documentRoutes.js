import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import uploadFileToFirebase from "../utils/firebaseStorage.js";
import Document from "../models/Document.js";
import { protect } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

/**
 * @route   POST /api/documents/upload
 * @desc    Upload a document and save the link
 * @access  Private (to be implemented)
 */
router.post("/upload", protect, upload.single("document"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }
  
  try {
    const fileUrl = await uploadFileToFirebase(req.file);

    const newDoc = new Document({
      user: req.user.id,
      houseNumber: req.body.houseNumber, // FIX: Use houseNumber from request body
      type: req.body.type,
      driveLink: fileUrl, // Save Firebase URL to driveLink field
    });

    await newDoc.save();

    const populatedDoc = await Document.findById(newDoc._id).populate('user', 'name flatNumber');

    res.status(201).json({ 
      message: "Document uploaded successfully!", 
      document: populatedDoc 
    });
  } catch (error) {
    console.error("Document upload route error:", error);
    res.status(500).json({ error: "Server error during file upload." });
  }
});

/**
 * @route   GET /api/documents
 * @desc    Get all uploaded documents for admin, or user's own docs
 * @access  Private (Admin / User)
 */
router.get("/", protect, async (req, res) => {
  try {
    let documents;
    // If admin, fetch all documents and populate user info
    if (req.user.role === 'admin') {
      documents = await Document.find().sort({ uploadedAt: -1 }).populate('user', 'name flatNumber');
    } else {
      // If regular user, fetch only their documents
      documents = await Document.find({ user: req.user.id }).sort({ uploadedAt: -1 }).populate('user', 'name flatNumber');
    }
    res.json(documents);
  } catch (error) {
    console.error("Get documents route error:", error);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
