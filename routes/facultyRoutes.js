
import express from "express";

import {
  createFaculty,
  getFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
} from "../controllers/facultyController.js";

import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";

const router = express.Router();

//==================================================
// Admin Only Routes
//==================================================

// Create Faculty
router.post(
  "/",
  protect,
  authorize("admin"),
  createFaculty,
);

// Get All Faculties
// Pagination, Search, Filters, Sorting and Redis
router.get(
  "/",
  protect,
  authorize("admin"),
  getFaculties,
);

// Get Faculty By ID
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getFacultyById,
);

// Update Faculty
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateFaculty,
);

// Delete Faculty
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteFaculty,
);

export default router;
