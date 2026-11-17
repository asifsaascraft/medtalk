
import express from "express";

import {
  createSpeciality,
  getSpecialities,
  getSpecialitiesAdmin,
  getSpecialityById,
  updateSpeciality,
  deleteSpeciality,
} from "../controllers/specialityController.js";

import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";

const router = express.Router();

//==================================================
// Public Route
//==================================================

// User registration dropdown
router.get("/", getSpecialities);

//==================================================
// Admin Only Routes
//==================================================

// Get all specialities with pagination, search,
// filters, sorting and registered user counts
router.get(
  "/admin",
  protect,
  authorize("admin"),
  getSpecialitiesAdmin,
);

// Create
router.post(
  "/",
  protect,
  authorize("admin"),
  createSpeciality,
);

// Get By ID
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getSpecialityById,
);

// Update
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateSpeciality,
);

// Delete
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteSpeciality,
);

export default router;
