import bucket from "../config/firebaseConfig.js";
import fs from "fs";
import path from "path";

/**
 * Uploads a file to Firebase Storage.
 * @param {object} file - The file object from multer.
 * @returns {Promise<string>} The public URL to the uploaded file.
 */
async function uploadFileToFirebase(file) {
  const filename = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(file.path);

  const destination = `documents/${filename}`;
  const fileUpload = bucket.file(destination);

  try {
    await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Make the file publicly accessible
    await fileUpload.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Clean up the uploaded file from the local 'uploads' directory
    fs.unlinkSync(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading to Firebase Storage:", error);
    // Clean up the file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error("Failed to upload file to Firebase Storage.");
  }
}

export default uploadFileToFirebase;
