
import mongoose from "mongoose";

import User from "../models/User.js";
import Speciality from "../models/Speciality.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  successResponse,
  errorResponse,
} from "../utils/response.js";

import buildSearchQuery from "../utils/search.js";
import buildSortQuery from "../utils/sort.js";
import buildFiltersQuery from "../utils/filters.js";

import {
  getPagination,
  buildPaginationMeta,
} from "../utils/pagination.js";

import {
  getCache,
  setCache,
  deleteCacheByPattern,
} from "../utils/redisCache.js";

//==================================================
// Constants
//==================================================

const USER_SELECT_FIELDS =
  "fullName email mobile affiliation specialityId profileImage role status createdAt updatedAt";

const USER_SEARCH_FIELDS = [
  "fullName",
  "email",
  "mobile",
  "affiliation",
];

const USER_FILTER_FIELDS = [
  "specialityId",
  "status",
];

const USER_SORT_FIELDS = [
  "fullName",
  "email",
  "mobile",
  "affiliation",
  "createdAt",
  "updatedAt",
];

//==================================================
// Helper: Clear User Cache
//==================================================

const clearUserCache = async () => {
  await deleteCacheByPattern("users:*");
  await deleteCacheByPattern("user:*");
};

//==================================================
// Helper: Validate Email
//==================================================

const isValidEmail = (email) => {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
};

//==================================================
// 1. GET ALL USERS WITHOUT PAGINATION
// GET /api/users
//==================================================

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "user" })
    .select(USER_SELECT_FIELDS)
    .populate("specialityId", "specialityName")
    .sort({ createdAt: -1 });

  return successResponse(res, {
    message: "Users fetched successfully.",
    data: users,
  });
});

//==================================================
// 2. GET USERS WITH PAGINATION, SEARCH, FILTER & SORT
// GET /api/users/admin
//==================================================

export const getUsersAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);

  // Search
  const searchQuery = buildSearchQuery(
    req,
    USER_SEARCH_FIELDS,
  );

  // Filters
  const filtersQuery = buildFiltersQuery(
    req,
    USER_FILTER_FIELDS,
  );

  // Sorting
  const sortQuery = buildSortQuery(
    req,
    USER_SORT_FIELDS,
    "createdAt",
  );

  // Only user accounts should be managed here.
  const query = {
    role: "user",
    ...filtersQuery,
    ...searchQuery,
  };

  // Redis cache key
  const cacheKey = `users:admin:${JSON.stringify({
    query,
    sort: sortQuery,
    page,
    limit,
  })}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Users fetched successfully.",
      data: cachedData.data,
      pagination: cachedData.pagination,
    });
  }

  // Fetch users and total count together.
  const [users, total] = await Promise.all([
    User.find(query)
      .select(USER_SELECT_FIELDS)
      .populate("specialityId", "specialityName")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit),

    User.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(
    total,
    page,
    limit,
  );

  const responseData = {
    data: users,
    pagination,
  };

  // Cache for 5 minutes.
  await setCache(cacheKey, responseData, 300);

  return successResponse(res, {
    message: "Users fetched successfully.",
    data: users,
    pagination,
  });
});

//==================================================
// 3. UPDATE USER PROFILE
// PATCH /api/users/:id
//==================================================

export const updateUserProfile = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findOne({
      _id: id,
      role: "user",
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: "User not found.",
      });
    }

    const allowedFields = [
      "fullName",
      "email",
      "mobile",
      "affiliation",
      "specialityId",
      "profileImage",
    ];

    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length === 0
    ) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Please provide at least one profile field to update.",
      });
    }

    // Reject role, password, OTP and other protected fields.
    const unsupportedFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (unsupportedFields.length > 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: `These fields cannot be updated through this API: ${unsupportedFields.join(", ")}.`,
      });
    }

    const updates = {};

    // Full name
    if (body.fullName !== undefined) {
      if (
        typeof body.fullName !== "string" ||
        body.fullName.trim().length < 2 ||
        body.fullName.trim().length > 100
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Full name must contain 2 to 100 characters.",
        });
      }

      updates.fullName = body.fullName.trim();
    }

    // Email
    if (body.email !== undefined) {
      if (!isValidEmail(body.email)) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Please enter a valid email address.",
        });
      }

      updates.email = body.email.trim().toLowerCase();
    }

    // Mobile
    if (body.mobile !== undefined) {
      if (
        typeof body.mobile !== "string" ||
        !/^[6-9]\d{9}$/.test(body.mobile.trim())
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Please enter a valid 10-digit mobile number.",
        });
      }

      updates.mobile = body.mobile.trim();
    }

    // Affiliation
    if (body.affiliation !== undefined) {
      if (
        typeof body.affiliation !== "string" ||
        body.affiliation.trim().length < 2 ||
        body.affiliation.trim().length > 300
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Affiliation must contain 2 to 300 characters.",
        });
      }

      updates.affiliation = body.affiliation.trim();
    }

    // Speciality
    if (body.specialityId !== undefined) {
      if (
        !mongoose.Types.ObjectId.isValid(body.specialityId)
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Invalid speciality ID.",
        });
      }

      const specialityExists = await Speciality.exists({
        _id: body.specialityId,
      });

      if (!specialityExists) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Speciality not found.",
        });
      }

      updates.specialityId = body.specialityId;
    }

    // Profile image
    if (body.profileImage !== undefined) {
      if (
        body.profileImage !== null &&
        typeof body.profileImage !== "string"
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Profile image must be a string or null.",
        });
      }

      updates.profileImage =
        typeof body.profileImage === "string"
          ? body.profileImage.trim()
          : null;
    }

    // Check duplicate email or mobile.
    const duplicateConditions = [];

    if (updates.email) {
      duplicateConditions.push({
        email: updates.email,
      });
    }

    if (updates.mobile) {
      duplicateConditions.push({
        mobile: updates.mobile,
      });
    }

    if (duplicateConditions.length > 0) {
      const existingUser = await User.findOne({
        _id: { $ne: id },
        role: "user",
        $or: duplicateConditions,
      });

      if (existingUser) {
        return errorResponse(res, {
          statusCode: 409,
          message: "Email or mobile number is already registered.",
        });
      }
    }

    try {
      Object.assign(user, updates);

      await user.save();

      await user.populate(
        "specialityId",
        "specialityName",
      );

      await clearUserCache();

      return successResponse(res, {
        message: "User profile updated successfully.",
        data: user,
      });
    } catch (error) {
      // Handle duplicate-key errors caused by concurrent requests.
      if (error?.code === 11000) {
        return errorResponse(res, {
          statusCode: 409,
          message: "Email or mobile number is already registered.",
        });
      }

      throw error;
    }
  },
);
