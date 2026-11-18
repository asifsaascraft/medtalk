
import mongoose from "mongoose";

import Faculty from "../models/Faculty.js";
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
// Helper: Clear Faculty Cache
//==================================================

const clearFacultyCache = async () => {
  await deleteCacheByPattern("faculties:*");
  await deleteCacheByPattern("faculty:*");
};

//==================================================
// Helper: Validate Speciality
//==================================================

const validateSpeciality = async (specialityId) => {
  if (!mongoose.Types.ObjectId.isValid(specialityId)) {
    return false;
  }

  const speciality = await Speciality.findById(specialityId);

  return !!speciality;
};

//==================================================
// Create Faculty (Admin Only)
//==================================================

export const createFaculty = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    mobile,
    affiliation,
    specialityId,
  } = req.body || {};

  // Validate Required Fields

  if (
    !fullName?.trim() ||
    !email?.trim() ||
    !mobile?.trim() ||
    !affiliation?.trim() ||
    !specialityId
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "All faculty fields are required.",
    });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedMobile = mobile.trim();

  // Validate Speciality ID and Existence

  const isValidSpeciality = await validateSpeciality(specialityId);

  if (!isValidSpeciality) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid or non-existing speciality.",
    });
  }

  // Check Duplicate Email or Mobile

  const existingFaculty = await Faculty.findOne({
    $or: [
      { email: trimmedEmail },
      { mobile: trimmedMobile },
    ],
  });

  if (existingFaculty) {
    return errorResponse(res, {
      statusCode: 409,
      message:
        "Faculty with this email or mobile number already exists.",
    });
  }

  // Create Faculty

  const faculty = await Faculty.create({
    fullName,
    email: trimmedEmail,
    mobile: trimmedMobile,
    affiliation,
    specialityId,
  });

  // Populate Speciality

  await faculty.populate("specialityId", "specialityName");

  // Clear Redis Cache

  await clearFacultyCache();

  return successResponse(res, {
    statusCode: 201,
    message: "Faculty created successfully.",
    data: faculty,
  });
});

//==================================================
// Get All Faculties (Admin Only)
// Pagination, Search, Filters, Sorting and Redis
//==================================================

export const getFaculties = asyncHandler(async (req, res) => {
  // Pagination

  const { page, limit, skip } = getPagination(req);

  // Search

  const searchQuery = buildSearchQuery(req, [
    "fullName",
    "email",
    "mobile",
    "affiliation",
  ]);

  // Filters

  const filtersQuery = buildFiltersQuery(req, [
    "specialityId",
  ]);

  // Final Query

  const query = {
    ...searchQuery,
    ...filtersQuery,
  };

  // Sorting

  const sort = buildSortQuery(
    req,
    ["fullName", "email", "createdAt", "updatedAt"],
    "createdAt",
  );

  // Redis Cache Key

  const cacheKey = `faculties:list:${JSON.stringify({
    query,
    sort,
    page,
    limit,
  })}`;

  // Check Redis Cache

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Faculties fetched successfully (from cache).",
      data: cachedData.data,
      pagination: cachedData.pagination,
    });
  }

  // Total Faculties

  const total = await Faculty.countDocuments(query);

  // Fetch Faculties

  const faculties = await Faculty.find(query)
    .populate("specialityId", "specialityName")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Pagination Metadata

  const pagination = buildPaginationMeta(
    total,
    page,
    limit,
  );

  // Prepare Response Data

  const responseData = {
    data: faculties,
    pagination,
  };

  // Save Redis Cache

  await setCache(cacheKey, responseData, 3600);

  return successResponse(res, {
    message: "Faculties fetched successfully.",
    data: faculties,
    pagination,
  });
});

//==================================================
// Get Faculty By ID (Admin Only)
//==================================================

export const getFacultyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid faculty ID.",
    });
  }

  // Redis Cache Key

  const cacheKey = `faculty:${id}`;

  // Check Redis Cache

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Faculty fetched successfully (from cache).",
      data: cachedData,
    });
  }

  // MongoDB

  const faculty = await Faculty.findById(id).populate(
    "specialityId",
    "specialityName",
  );

  if (!faculty) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Faculty not found.",
    });
  }

  // Save Redis Cache

  await setCache(cacheKey, faculty, 3600);

  return successResponse(res, {
    message: "Faculty fetched successfully.",
    data: faculty,
  });
});

//==================================================
// Update Faculty (Admin Only)
//==================================================

export const updateFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    fullName,
    email,
    mobile,
    affiliation,
    specialityId,
  } = req.body || {};

  // Validate ObjectId

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid faculty ID.",
    });
  }

  // Validate Required Fields

  if (
    !fullName?.trim() ||
    !email?.trim() ||
    !mobile?.trim() ||
    !affiliation?.trim() ||
    !specialityId
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "All faculty fields are required.",
    });
  }

  // Find Faculty

  const faculty = await Faculty.findById(id);

  if (!faculty) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Faculty not found.",
    });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedMobile = mobile.trim();

  // Validate Speciality

  const isValidSpeciality = await validateSpeciality(specialityId);

  if (!isValidSpeciality) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid or non-existing speciality.",
    });
  }

  // Check Duplicate Email or Mobile

  const existingFaculty = await Faculty.findOne({
    _id: { $ne: id },
    $or: [
      { email: trimmedEmail },
      { mobile: trimmedMobile },
    ],
  });

  if (existingFaculty) {
    return errorResponse(res, {
      statusCode: 409,
      message:
        "Another faculty already uses this email or mobile number.",
    });
  }

  // Update Faculty

  faculty.fullName = fullName.trim();
  faculty.email = trimmedEmail;
  faculty.mobile = trimmedMobile;
  faculty.affiliation = affiliation.trim();
  faculty.specialityId = specialityId;

  await faculty.save();

  // Populate Speciality

  await faculty.populate("specialityId", "specialityName");

  // Clear Redis Cache

  await clearFacultyCache();

  return successResponse(res, {
    message: "Faculty updated successfully.",
    data: faculty,
  });
});

//==================================================
// Delete Faculty (Admin Only)
//==================================================

export const deleteFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid faculty ID.",
    });
  }

  // Find Faculty

  const faculty = await Faculty.findById(id);

  if (!faculty) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Faculty not found.",
    });
  }

  // Delete Faculty

  await faculty.deleteOne();

  // Clear Redis Cache

  await clearFacultyCache();

  return successResponse(res, {
    message: "Faculty deleted successfully.",
  });
});
