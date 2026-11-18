
import express from "express";

import {
  getAllUsers,
  getUsersAdmin,
  updateUserProfile,
} from "../controllers/userController.js";

import protect from "../middlewares/protect.js";
import authorize from "../middlewares/authorize.js";

const router = express.Router();

// All User Management APIs are admin-only.

// Get all users without pagination.
router.get(
  "/",
  protect,
  authorize("admin"),
  getAllUsers,
);

// Get users with pagination, search, filter and sorting.
// Keep this route before any future /:id GET route.
router.get(
  "/admin",
  protect,
  authorize("admin"),
  getUsersAdmin,
);

// Update user profile.
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  updateUserProfile,
);

export default router;
