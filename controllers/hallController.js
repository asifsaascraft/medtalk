
import mongoose from "mongoose";

import Hall from "../models/Hall.js";
import Conference from "../models/Conference.js";

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

const HALL_SEARCH_FIELDS = ["hallName"];

const HALL_FILTER_FIELDS = ["status"];

const HALL_SORT_FIELDS = [
  "hallName",
  "status",
  "createdAt",
  "updatedAt",
];

const HALL_SELECT_FIELDS =
  "conferenceId hallName streamLink status createdAt updatedAt";

//==================================================
// Helper: Validate ObjectId
//==================================================

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

//==================================================
// Helper: Validate Conference
//==================================================

const findConference = async (conferenceId) => {
  if (!isValidObjectId(conferenceId)) {
    return null;
  }

  return Conference.findById(conferenceId).select("_id conferenceName");
};

//==================================================
// Helper: Clear Hall Cache
//==================================================

const clearHallCache = async (conferenceId) => {
  await Promise.all([
    deleteCacheByPattern(`halls:${conferenceId}:*`),
    deleteCacheByPattern(`hall:${conferenceId}:*`),
  ]);
};

//==================================================
// Helper: Build Hall Query
//==================================================

const buildHallQuery = (req, extraQuery = {}) => {
  const searchQuery = buildSearchQuery(
    req,
    HALL_SEARCH_FIELDS,
  );

  const filtersQuery = buildFiltersQuery(
    req,
    HALL_FILTER_FIELDS,
  );

  return {
    ...filtersQuery,
    ...searchQuery,
    conferenceId: req.params.conferenceId,
    ...extraQuery,
  };
};

//==================================================
// Helper: Populate Conference
//==================================================

const populateConference = (query) => {
  return query.populate(
    "conferenceId",
    "conferenceName startDateTime endDateTime"
  );
};

//==================================================
// CREATE HALL
// POST /api/conferences/:conferenceId/halls
//==================================================

export const createHall = asyncHandler(async (req, res) => {
  const { conferenceId } = req.params;

  const {
    hallName,
    streamLink,
    status,
  } = req.body || {};

  // Validate Conference ID

  if (!isValidObjectId(conferenceId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  // Validate Conference existence

  const conference = await findConference(conferenceId);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  // Validate required fields

  if (!hallName?.trim() || !streamLink?.trim()) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Hall name and stream link are required.",
    });
  }

  // Validate status

  if (
    status !== undefined &&
    !["Active", "Inactive"].includes(status)
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Status must be Active or Inactive.",
    });
  }

  // Check duplicate Hall name inside this Conference

  const existingHall = await Hall.findOne({
    conferenceId,
    hallName: hallName.trim(),
  });

  if (existingHall) {
    return errorResponse(res, {
      statusCode: 409,
      message: "A hall with this name already exists in this conference.",
    });
  }

  // Create Hall

  const hall = await Hall.create({
    conferenceId,
    hallName: hallName.trim(),
    streamLink: streamLink.trim(),
    status: status || "Active",
  });

  await populateConference(hall);

  await clearHallCache(conferenceId);

  return successResponse(res, {
    statusCode: 201,
    message: "Hall created successfully.",
    data: hall,
  });
});

//==================================================
// GET ALL HALLS WITH PAGINATION
// GET /api/conferences/:conferenceId/halls
//==================================================

export const getHalls = asyncHandler(async (req, res) => {
  const { conferenceId } = req.params;

  if (!isValidObjectId(conferenceId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  const conference = await findConference(conferenceId);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  const { page, limit, skip } = getPagination(req);

  const query = buildHallQuery(req);

  const sort = buildSortQuery(
    req,
    HALL_SORT_FIELDS,
    "createdAt",
  );

  const cacheKey = `halls:${conferenceId}:admin:${JSON.stringify({
    query,
    sort,
    page,
    limit,
  })}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Halls fetched successfully (from cache).",
      data: cachedData.data,
      pagination: cachedData.pagination,
    });
  }

  const [halls, total] = await Promise.all([
    populateConference(
      Hall.find(query)
        .select(HALL_SELECT_FIELDS)
        .sort(sort)
        .skip(skip)
        .limit(limit),
    ),

    Hall.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(
    total,
    page,
    limit,
  );

  const responseData = {
    data: halls,
    pagination,
  };

  await setCache(cacheKey, responseData, 3600);

  return successResponse(res, {
    message: "Halls fetched successfully.",
    data: halls,
    pagination,
  });
});

//==================================================
// GET ACTIVE HALLS WITH PAGINATION
// GET /api/conferences/:conferenceId/halls/active
//==================================================

export const getActiveHalls = asyncHandler(async (req, res) => {
  const { conferenceId } = req.params;

  if (!isValidObjectId(conferenceId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  const conference = await findConference(conferenceId);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  const { page, limit, skip } = getPagination(req);

  const query = buildHallQuery(req, {
    status: "Active",
  });

  const sort = buildSortQuery(
    req,
    HALL_SORT_FIELDS,
    "createdAt",
  );

  const cacheKey = `halls:${conferenceId}:active:${JSON.stringify({
    query,
    sort,
    page,
    limit,
  })}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Active halls fetched successfully (from cache).",
      data: cachedData.data,
      pagination: cachedData.pagination,
    });
  }

  const [halls, total] = await Promise.all([
    populateConference(
      Hall.find(query)
        .select(HALL_SELECT_FIELDS)
        .sort(sort)
        .skip(skip)
        .limit(limit),
    ),

    Hall.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(
    total,
    page,
    limit,
  );

  const responseData = {
    data: halls,
    pagination,
  };

  await setCache(cacheKey, responseData, 3600);

  return successResponse(res, {
    message: "Active halls fetched successfully.",
    data: halls,
    pagination,
  });
});

//==================================================
// GET ALL ACTIVE HALLS WITHOUT PAGINATION
// GET /api/conferences/:conferenceId/halls/active/all
//==================================================

export const getAllActiveHalls = asyncHandler(async (req, res) => {
  const { conferenceId } = req.params;

  if (!isValidObjectId(conferenceId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  const conference = await findConference(conferenceId);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  const query = buildHallQuery(req, {
    status: "Active",
  });

  const sort = buildSortQuery(
    req,
    HALL_SORT_FIELDS,
    "hallName",
  );

  const cacheKey = `halls:${conferenceId}:active:all:${JSON.stringify({
    query,
    sort,
  })}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Active halls fetched successfully (from cache).",
      data: cachedData,
    });
  }

  const halls = await populateConference(
    Hall.find(query)
      .select(HALL_SELECT_FIELDS)
      .sort(sort),
  );

  await setCache(cacheKey, halls, 3600);

  return successResponse(res, {
    message: "Active halls fetched successfully.",
    data: halls,
  });
});

//==================================================
// GET HALL BY ID
// GET /api/conferences/:conferenceId/halls/:hallId
//==================================================

export const getHallById = asyncHandler(async (req, res) => {
  const { conferenceId, hallId } = req.params;

  if (
    !isValidObjectId(conferenceId) ||
    !isValidObjectId(hallId)
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID or hall ID.",
    });
  }

  const conference = await findConference(conferenceId);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  const cacheKey = `hall:${conferenceId}:${hallId}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Hall fetched successfully (from cache).",
      data: cachedData,
    });
  }

  const hall = await populateConference(
    Hall.findOne({
      _id: hallId,
      conferenceId,
    }).select(HALL_SELECT_FIELDS),
  );

  if (!hall) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Hall not found in this conference.",
    });
  }

  await setCache(cacheKey, hall, 3600);

  return successResponse(res, {
    message: "Hall fetched successfully.",
    data: hall,
  });
});

//==================================================
// UPDATE HALL
// PUT /api/conferences/:conferenceId/halls/:hallId
//==================================================

export const updateHall = asyncHandler(async (req, res) => {
  const { conferenceId, hallId } = req.params;

  const {
    hallName,
    streamLink,
    status,
  } = req.body || {};

  if (
    !isValidObjectId(conferenceId) ||
    !isValidObjectId(hallId)
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID or hall ID.",
    });
  }

  const conference = await findConference(conferenceId);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  const hall = await Hall.findOne({
    _id: hallId,
    conferenceId,
  });

  if (!hall) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Hall not found in this conference.",
    });
  }

  // Validate at least one field

  if (
    hallName === undefined &&
    streamLink === undefined &&
    status === undefined
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Please provide at least one field to update.",
    });
  }

  if (
    hallName !== undefined &&
    (typeof hallName !== "string" || !hallName.trim())
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Hall name cannot be empty.",
    });
  }

  if (
    streamLink !== undefined &&
    (typeof streamLink !== "string" || !streamLink.trim())
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Stream link cannot be empty.",
    });
  }

  if (
    status !== undefined &&
    !["Active", "Inactive"].includes(status)
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Status must be Active or Inactive.",
    });
  }

  const nextHallName =
    hallName !== undefined ? hallName.trim() : hall.hallName;

  // Check duplicate name inside this Conference

  if (nextHallName !== hall.hallName) {
    const existingHall = await Hall.findOne({
      _id: { $ne: hallId },
      conferenceId,
      hallName: nextHallName,
    });

    if (existingHall) {
      return errorResponse(res, {
        statusCode: 409,
        message: "A hall with this name already exists in this conference.",
      });
    }
  }

  if (hallName !== undefined) {
    hall.hallName = nextHallName;
  }

  if (streamLink !== undefined) {
    hall.streamLink = streamLink.trim();
  }

  if (status !== undefined) {
    hall.status = status;
  }

  await hall.save();

  await populateConference(hall);

  await clearHallCache(conferenceId);

  return successResponse(res, {
    message: "Hall updated successfully.",
    data: hall,
  });
});

//==================================================
// DELETE HALL
// DELETE /api/conferences/:conferenceId/halls/:hallId
//==================================================

export const deleteHall = asyncHandler(async (req, res) => {
  const { conferenceId, hallId } = req.params;

  if (
    !isValidObjectId(conferenceId) ||
    !isValidObjectId(hallId)
  ) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID or hall ID.",
    });
  }

  const conference = await findConference(conferenceId);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  const hall = await Hall.findOne({
    _id: hallId,
    conferenceId,
  });

  if (!hall) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Hall not found in this conference.",
    });
  }

  await hall.deleteOne();

  await clearHallCache(conferenceId);

  return successResponse(res, {
    message: "Hall deleted successfully.",
  });
});
