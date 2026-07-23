const express = require("express");
const router = express.Router();
const multer = require("multer");

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
      "text/plain",
      "text/html",
      "text/css",
      "text/javascript",
      "text/x-python",
      "application/json",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.post("/chat", authMiddleware, upload.single("file"), aiController.chat);

router.post("/generate-image", authMiddleware, aiController.generateImage);

module.exports = router;
