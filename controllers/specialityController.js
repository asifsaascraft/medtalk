
import mongoose from "mongoose";

import Speciality from "../models/Speciality.js";
import User from "../models/User.js";
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
// Create Speciality (Admin Only)
//==================================================

export const createSpeciality = asyncHandler(async (req, res) => {
  const { specialityName } = req.body;

  if (!specialityName?.trim()) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Speciality name is required.",
    });
  }

  const trimmedName = specialityName.trim();

  const existingSpeciality = await Speciality.findOne({
    specialityName: trimmedName,
  });

  if (existingSpeciality) {
    return errorResponse(res, {
      statusCode: 409,
      message: "This speciality name already exists.",
    });
  }

  const speciality = await Speciality.create({
    specialityName: trimmedName,
  });

  await deleteCacheByPattern("specialities*");

  return successResponse(res, {
    statusCode: 201,
    message: "Speciality created successfully.",
    data: speciality,
  });
});

//==================================================
// Get Specialities (Public)
// For User Registration Dropdown
//==================================================

export const getSpecialities = asyncHandler(async (req, res) => {
  const searchQuery = buildSearchQuery(req, [
    "specialityName",
  ]);

  const filtersQuery = buildFiltersQuery(req, []);

  const query = {
    ...searchQuery,
    ...filtersQuery,
  };

  const sort = buildSortQuery(
    req,
    ["specialityName", "createdAt", "updatedAt"],
    "specialityName",
  );

  const cacheKey = `specialities:public:${JSON.stringify({
    query,
    sort,
  })}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Specialities fetched successfully.",
      data: cachedData,
    });
  }

  const specialities = await Speciality.find(query).sort(sort);

  await setCache(cacheKey, specialities, 3600);

  return successResponse(res, {
    message: "Specialities fetched successfully.",
    data: specialities,
  });
});

//==================================================
// Get Specialities With User Count (Admin Only)
// Pagination, Search, Filters and Sorting
//==================================================


export const getSpecialitiesAdmin = asyncHandler(async (req, res) => {
  // Pagination
  const { page, limit, skip } = getPagination(req);

  // Search
  const searchQuery = buildSearchQuery(req, [
    "specialityName",
  ]);

  // Filters
  const filtersQuery = buildFiltersQuery(req, [
    "specialityName",
  ]);

  // Final Query
  const query = {
    ...searchQuery,
    ...filtersQuery,
  };

  // Sorting
  const sort = buildSortQuery(
    req,
    ["specialityName", "createdAt", "updatedAt"],
    "createdAt",
  );

  // Total Specialities
  const total = await Speciality.countDocuments(query);

  // Fetch Specialities With Registered User Count
  const specialities = await Speciality.aggregate([
    {
      $match: query,
    },
    {
      $sort: sort,
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: "_id",
        foreignField: "specialityId",
        as: "registeredUsers",
      },
    },
    {
      $addFields: {
        usersCount: {
          $size: "$registeredUsers",
        },
      },
    },
    {
      $project: {
        registeredUsers: 0,
        __v: 0,
      },
    },
  ]);

  // Pagination Metadata
  const pagination = buildPaginationMeta(
    total,
    page,
    limit,
  );

  return successResponse(res, {
    message: "Specialities fetched successfully.",
    data: specialities,
    pagination,
  });
});


//==================================================
// Get Speciality By ID (Admin Only)
//==================================================

export const getSpecialityById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  const cacheKey = `speciality:${id}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Speciality fetched successfully.",
      data: cachedData,
    });
  }

  const speciality = await Speciality.findById(id);

  if (!speciality) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  await setCache(cacheKey, speciality, 3600);

  return successResponse(res, {
    message: "Speciality fetched successfully.",
    data: speciality,
  });
});

//==================================================
// Update Speciality (Admin Only)
//==================================================

export const updateSpeciality = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { specialityName } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  if (!specialityName?.trim()) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Speciality name is required.",
    });
  }

  const speciality = await Speciality.findById(id);

  if (!speciality) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  const trimmedName = specialityName.trim();

  const existingSpeciality = await Speciality.findOne({
    specialityName: trimmedName,
    _id: { $ne: id },
  });

  if (existingSpeciality) {
    return errorResponse(res, {
      statusCode: 409,
      message: "Speciality already exists.",
    });
  }

  speciality.specialityName = trimmedName;

  await speciality.save();

  await deleteCacheByPattern("specialities*");
  await deleteCacheByPattern("speciality*");

  return successResponse(res, {
    message: "Speciality updated successfully.",
    data: speciality,
  });
});

//==================================================
// Delete Speciality (Admin Only)
// Prevent Deletion If Users Are Registered
//==================================================

export const deleteSpeciality = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid speciality ID.",
    });
  }

  const speciality = await Speciality.findById(id);

  if (!speciality) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Speciality not found.",
    });
  }

  // Check whether users are registered under this speciality
  const usersCount = await User.countDocuments({
    specialityId: speciality._id,
  });

  if (usersCount > 0) {
    return errorResponse(res, {
      statusCode: 409,
      message: `Cannot delete this speciality because ${usersCount} user(s) are registered under it.`,
    });
  }

  await speciality.deleteOne();

  await deleteCacheByPattern("specialities*");
  await deleteCacheByPattern("speciality*");

  return successResponse(res, {
    message: "Speciality deleted successfully.",
  });
});
