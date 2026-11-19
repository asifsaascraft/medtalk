
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

const BUCKET = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const PDF_MAX_SIZE = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const imageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (["image", "banner"].includes(file.fieldname)) {
    if (
      !imageExtensions.includes(extension) ||
      !imageMimeTypes.includes(file.mimetype)
    ) {
      return callback(
        new Error("Only JPG, JPEG, PNG and WEBP images are allowed."),
      );
    }

    return callback(null, true);
  }

  if (file.fieldname === "brochureUpload") {
    if (
      extension !== ".pdf" ||
      file.mimetype !== "application/pdf"
    ) {
      return callback(
        new Error("Only PDF files are allowed for brochureUpload."),
      );
    }

    return callback(null, true);
  }

  return callback(new Error("Invalid upload field."));
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    files: 3,
    fileSize: PDF_MAX_SIZE,
  },
});

const uploadFields = multerUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "brochureUpload", maxCount: 1 },
]);

const getFileExtension = (filename) =>
  path.extname(filename).toLowerCase();

const uploadToS3 = async (file, folder) => {
  const extension = getFileExtension(file.originalname);
  const fileName = `${crypto.randomUUID()}${extension}`;
  const key = `conferences/${folder}/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return {
    key,
    url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`,
  };
};

const deleteUploadedFiles = async (uploadedFiles = []) => {
  await Promise.allSettled(
    uploadedFiles.map(({ key }) =>
      s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        }),
      ),
    ),
  );
};

const uploadConferenceFiles = (req, res, next) => {
  uploadFields(req, res, async (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError
          ? error.code === "LIMIT_FILE_SIZE"
            ? "File size exceeded. Images must be up to 5MB and brochure must be up to 10MB."
            : error.message
          : error.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    const files = req.files || {};

    // Validate image-specific size limits.
    for (const field of ["image", "banner"]) {
      if (files[field]?.[0]?.size > IMAGE_MAX_SIZE) {
        return res.status(400).json({
          success: false,
          message: `${field} must not exceed 5MB.`,
        });
      }
    }

    const uploaded = [];

    try {
      const uploadedFiles = {};

      for (const field of ["image", "banner", "brochureUpload"]) {
        const file = files[field]?.[0];

        if (!file) continue;

        const folder =
          field === "brochureUpload" ? "brochures" : "images";

        const result = await uploadToS3(file, folder);

        uploaded.push(result);

        uploadedFiles[field] = result.url;
      }

      req.uploadedFiles = uploadedFiles;
      req.uploadedS3Objects = uploaded;

      return next();
    } catch (uploadError) {
      await deleteUploadedFiles(uploaded);

      console.error("Conference S3 Upload Error:", uploadError);

      return res.status(500).json({
        success: false,
        message: "Unable to upload conference files.",
      });
    }
  });
};

export { deleteUploadedFiles };
export default uploadConferenceFiles;
