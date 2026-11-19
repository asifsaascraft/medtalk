
import express from "express";

import {
  createConference,
  getConferences,
  getAllConferences,
  getConferenceById,
  updateConference,
  deleteConference,
  getPublicConferences,
  getAllPublicConferences,
  getPublicConferencesByType,
  getAllPublicConferencesByType,
} from "../controllers/conferenceController.js";

import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";
import uploadConferenceFiles from "../middlewares/uploadConference.js";

const router = express.Router();

//==================================================
// PUBLIC ROUTES
//==================================================

// Active conferences with pagination
router.get("/public", getPublicConferences);

// Active conferences without pagination
router.get("/public/all", getAllPublicConferences);

// Active conferences by type with pagination
router.get(
  "/public/type/:conferenceType",
  getPublicConferencesByType,
);

// Active conferences by type without pagination
router.get(
  "/public/type/:conferenceType/all",
  getAllPublicConferencesByType,
);

//==================================================
// ADMIN ROUTES
//==================================================

// Get all conferences with pagination
router.get(
  "/",
  protect,
  authorize("admin"),
  getConferences,
);

// Get all conferences without pagination
router.get(
  "/all",
  protect,
  authorize("admin"),
  getAllConferences,
);

// Create conference
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadConferenceFiles,
  createConference,
);

// Get conference by ID
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getConferenceById,
);

// Update conference
router.put(
  "/:id",
  protect,
  authorize("admin"),
  uploadConferenceFiles,
  updateConference,
);

// Delete conference
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteConference,
);

export default router;
