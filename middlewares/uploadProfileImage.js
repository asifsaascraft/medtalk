import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import s3 from "../config/s3.js";

const BUCKET = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(
    file.originalname,
  ).toLowerCase();

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedExtensions.includes(extension) ||
    !allowedMimeTypes.includes(file.mimetype)
  ) {
    return cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed.",
      ),
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: MAX_SIZE,
  },
}).single("profileImage");

const uploadProfileImage = (
  req,
  res,
  next,
) => {
  upload(req, res, async (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError
          ? error.code === "LIMIT_FILE_SIZE"
            ? "Profile image size must not exceed 5MB."
            : error.message
          : error.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required.",
      });
    }

    try {
      const extension = path.extname(
        req.file.originalname,
      ).toLowerCase();

      const filename =
        `${crypto.randomUUID()}${extension}`;

      const key = `users/profile-images/${filename}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }),
      );

      req.profileImageUrl =
        `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

      next();
    } catch (err) {
      console.error(
        "Profile Upload Error:",
        err,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to upload profile image.",
      });
    }
  });
};

export default uploadProfileImage;