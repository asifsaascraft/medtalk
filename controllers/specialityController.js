
import mongoose from "mongoose";

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
  getCache,
  setCache,
  deleteCacheByPattern,
} from "../utils/redisCache.js";

//==============================
// Create Speciality
//==============================
export const createSpeciality = asyncHandler(async (req, res) => {
  const { specialityName } = req.body;

  // Validate

  if (!specialityName?.trim()) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Speciality name is required.",
    });
  }

  // Check Duplicate

  const existingSpeciality = await Speciality.findOne({
    specialityName: specialityName.trim(),
  });

  if (existingSpeciality) {
    return errorResponse(res, {
      statusCode: 409,
      message: "This speciality name already exists.",
    });
  }

  // Create

  const speciality = await Speciality.create({
    specialityName: specialityName.trim(),
  });

  // Clear Redis Cache

  await deleteCacheByPattern("specialities*");

  return successResponse(res, {
    statusCode: 201,

    message: "Speciality created successfully.",

    data: speciality,
  });
});

//==============================
// Get Specialities
//==============================
export const getSpecialities = asyncHandler(async (req, res) => {
  // Search

  const searchQuery = buildSearchQuery(req, [
    "specialityName",
  ]);

  // Filters

  const filtersQuery = buildFiltersQuery(req, []);

  // Final Query

  const query = {
    ...searchQuery,
    ...filtersQuery,
  };

  // Sorting

  const sort = buildSortQuery(req);

  // Cache Key

  const cacheKey = `specialities:${JSON.stringify({
    query,
    sort,
  })}`;

  // Check Redis

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message:
        "Specialities fetched successfully (from cache).",

      data: cachedData,
    });
  }

  // MongoDB

  const specialities =
    await Speciality.find(query).sort(sort);

  // Save Cache

  await setCache(
    cacheKey,
    specialities,
    3600,
  );

  return successResponse(res, {
    message: "Specialities fetched successfully.",

    data: specialities,
  });
});

//==============================
// Get Speciality By ID
//==============================
export const getSpecialityById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  // Cache Key

  const cacheKey = `speciality:${id}`;

  // Check Redis

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message:
        "Speciality fetched successfully (from cache).",

      data: cachedData,
    });
  }

  // MongoDB

  const speciality = await Speciality.findById(id);

  if (!speciality) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  // Save Cache

  await setCache(cacheKey, speciality, 3600);

  return successResponse(res, {
    message: "Speciality fetched successfully.",

    data: speciality,
  });
});

//==============================
// Update Speciality
//==============================
export const updateSpeciality = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { specialityName } = req.body;

  // Validate ObjectId

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  // Validate

  if (!specialityName?.trim()) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Speciality name is required.",
    });
  }

  // Find Speciality

  const speciality = await Speciality.findById(id);

  if (!speciality) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  // Check Duplicate

  const existingSpeciality = await Speciality.findOne({
    specialityName: specialityName.trim(),
    _id: { $ne: id },
  });

  if (existingSpeciality) {
    return errorResponse(res, {
      statusCode: 409,
      message: "Speciality already exists.",
    });
  }

  // Update

  speciality.specialityName = specialityName.trim();

  await speciality.save();

  // Clear Redis Cache

  await deleteCacheByPattern("specialities*");
  await deleteCacheByPattern("speciality*");

  return successResponse(res, {
    message: "Speciality updated successfully.",

    data: speciality,
  });
});

//==============================
// Delete Speciality
//==============================
export const deleteSpeciality = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  // Find Speciality

  const speciality = await Speciality.findById(id);

  if (!speciality) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  // Delete

  await speciality.deleteOne();

  // Clear Redis Cache

  await deleteCacheByPattern("specialities*");
  await deleteCacheByPattern("speciality*");

  return successResponse(res, {
    message: "Speciality deleted successfully.",
  });
});
