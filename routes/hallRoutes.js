
import express from "express";

import {
  createHall,
  getHalls,
  getActiveHalls,
  getAllActiveHalls,
  getHallById,
  updateHall,
  deleteHall,
} from "../controllers/hallController.js";

import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";

const router = express.Router({ mergeParams: true });

// All Hall APIs require Admin authentication.
router.use(protect, authorize("admin"));

// GET all halls with pagination
// POST create hall
router
  .route("/")
  .get(getHalls)
  .post(createHall);

// GET active halls with pagination
router.get("/active", getActiveHalls);

// GET all active halls without pagination
router.get("/active/all", getAllActiveHalls);

// GET, UPDATE and DELETE hall by ID
router
  .route("/:hallId")
  .get(getHallById)
  .put(updateHall)
  .delete(deleteHall);

export default router;
