import mongoose from "mongoose";

import Conference from "../models/Conference.js";
import Speciality from "../models/Speciality.js";

import asyncHandler from "../utils/asyncHandler.js";

import { successResponse, errorResponse } from "../utils/response.js";

import buildSearchQuery from "../utils/search.js";
import buildSortQuery from "../utils/sort.js";
import buildFiltersQuery from "../utils/filters.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import {
  getCache,
  setCache,
  deleteCacheByPattern,
} from "../utils/redisCache.js";

import deleteS3Object from "../utils/deleteS3Object.js";
import { deleteUploadedFiles } from "../middlewares/uploadConference.js";

//==================================================
// Constants
//==================================================

const CONFERENCE_SEARCH_FIELDS = ["conferenceName", "venue"];

const CONFERENCE_FILTER_FIELDS = ["specialityId", "conferenceType", "status"];

const CONFERENCE_SORT_FIELDS = [
  "conferenceName",
  "startDateTime",
  "endDateTime",
  "conferenceType",
  "amount",
  "status",
  "createdAt",
  "updatedAt",
];

const CONFERENCE_SELECT_FIELDS =
  "conferenceName specialityId startDateTime endDateTime venue conferenceType amount image banner brochureUpload conferenceDetail status createdAt updatedAt";

//==================================================
// Helper: Clear Conference Cache
//==================================================

const clearConferenceCache = async () => {
  await deleteCacheByPattern("conferences:*");
  await deleteCacheByPattern("conference:*");
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
// Helper: Validate Conference Type
//==================================================

const VALID_CONFERENCE_TYPES = ["Paid", "Free", "Restricted"];

const isValidConferenceType = (type) => VALID_CONFERENCE_TYPES.includes(type);

//==================================================
// Helper: Validate Date Range
//==================================================

const isValidDateRange = (startDateTime, endDateTime) => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  return (
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    end >= start
  );
};

//==================================================
// Helper: Delete Conference S3 Files
//==================================================

const deleteConferenceFiles = async (conference) => {
  await Promise.allSettled([
    deleteS3Object(conference.image),
    deleteS3Object(conference.banner),
    deleteS3Object(conference.brochureUpload),
  ]);
};

//==================================================
// Helper: Build Conference Query
//==================================================

const buildConferenceQuery = (req, extraQuery = {}) => {
  const searchQuery = buildSearchQuery(req, CONFERENCE_SEARCH_FIELDS);

  const filtersQuery = buildFiltersQuery(req, CONFERENCE_FILTER_FIELDS);

  return {
    ...filtersQuery,
    ...searchQuery,
    ...extraQuery,
  };
};

//==================================================
// Create Conference (Admin Only)
//==================================================

export const createConference = asyncHandler(async (req, res) => {
  const {
    conferenceName,
    specialityId,
    startDateTime,
    endDateTime,
    venue,
    conferenceType,
    amount,
    conferenceDetail,
    status,
  } = req.body || {};

  const uploadedFiles = req.uploadedFiles || {};

  const cleanupNewUploads = async () => {
    await deleteUploadedFiles(req.uploadedS3Objects || []);
  };

  // Required fields

  if (
    !conferenceName?.trim() ||
    !specialityId ||
    !startDateTime ||
    !endDateTime ||
    !venue?.trim() ||
    !conferenceType ||
    !conferenceDetail?.trim()
  ) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "All required conference fields must be provided.",
    });
  }

  // Required files

  if (
    !uploadedFiles.image ||
    !uploadedFiles.banner ||
    !uploadedFiles.brochureUpload
  ) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Image, banner and brochure are required.",
    });
  }

  // Conference type

  if (!isValidConferenceType(conferenceType)) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Conference type must be Paid, Free, or Restricted.",
    });
  }

  // Amount validation

  if (conferenceType === "Paid") {
    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0
    ) {
      await cleanupNewUploads();

      return errorResponse(res, {
        statusCode: 400,
        message: "A valid amount is required for Paid conferences.",
      });
    }
  } else if (amount !== undefined && amount !== "") {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Amount is only allowed for Paid conferences.",
    });
  }

  // Date validation

  if (!isValidDateRange(startDateTime, endDateTime)) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message:
        "End date time must be greater than or equal to start date time.",
    });
  }

  // Speciality validation

  const isValidSpeciality = await validateSpeciality(specialityId);

  if (!isValidSpeciality) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid or non-existing speciality.",
    });
  }

  try {
    const conference = await Conference.create({
      conferenceName: conferenceName.trim(),
      specialityId,
      startDateTime,
      endDateTime,
      venue: venue.trim(),
      conferenceType,
      amount: conferenceType === "Paid" ? Number(amount) : undefined,
      image: uploadedFiles.image,
      banner: uploadedFiles.banner,
      brochureUpload: uploadedFiles.brochureUpload,
      conferenceDetail: conferenceDetail.trim(),
      status: status || "Active",
    });

    await conference.populate("specialityId", "specialityName");

    await clearConferenceCache();

    return successResponse(res, {
      statusCode: 201,
      message: "Conference created successfully.",
      data: conference,
    });
  } catch (error) {
    await cleanupNewUploads();
    throw error;
  }
});

//==================================================
// Get All Conferences (Admin Only)
// Pagination, Search, Filters, Sorting and Redis
//==================================================

export const getConferences = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);

  const query = buildConferenceQuery(req);

  const sort = buildSortQuery(req, CONFERENCE_SORT_FIELDS, "createdAt");

  const cacheKey = `conferences:admin:${JSON.stringify({
    query,
    sort,
    page,
    limit,
  })}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Conferences fetched successfully (from cache).",
      data: cachedData.data,
      pagination: cachedData.pagination,
    });
  }

  const [conferences, total] = await Promise.all([
    Conference.find(query)
      .select(CONFERENCE_SELECT_FIELDS)
      .populate("specialityId", "specialityName")
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Conference.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);

  const responseData = {
    data: conferences,
    pagination,
  };

  await setCache(cacheKey, responseData, 3600);

  return successResponse(res, {
    message: "Conferences fetched successfully.",
    data: conferences,
    pagination,
  });
});

//==================================================
// Get All Conferences Without Pagination (Admin)
//==================================================

export const getAllConferences = asyncHandler(async (req, res) => {
  const query = buildConferenceQuery(req);

  const sort = buildSortQuery(req, CONFERENCE_SORT_FIELDS, "createdAt");

  const conferences = await Conference.find(query)
    .select(CONFERENCE_SELECT_FIELDS)
    .populate("specialityId", "specialityName")
    .sort(sort);

  return successResponse(res, {
    message: "Conferences fetched successfully.",
    data: conferences,
  });
});

//==================================================
// Get Conference By ID (Admin Only)
//==================================================

export const getConferenceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  const cacheKey = `conference:${id}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Conference fetched successfully (from cache).",
      data: cachedData,
    });
  }

  const conference = await Conference.findById(id)
    .select(CONFERENCE_SELECT_FIELDS)
    .populate("specialityId", "specialityName");

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  await setCache(cacheKey, conference, 3600);

  return successResponse(res, {
    message: "Conference fetched successfully.",
    data: conference,
  });
});

//==================================================
// Public: Get Active Conference Details By ID
//==================================================

export const getPublicConferenceById =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid conference ID.",
      });
    }

    const cacheKey = `conference:public:${id}`;

    const cachedData = await getCache(cacheKey);

    if (cachedData) {
      return successResponse(res, {
        message:
          "Conference details fetched successfully (from cache).",
        data: cachedData,
      });
    }

    const conference =
      await Conference.findOne({
        _id: id,
        status: "Active",
      })
        .select(CONFERENCE_SELECT_FIELDS)
        .populate(
          "specialityId",
          "specialityName",
        );

    if (!conference) {
      return errorResponse(res, {
        statusCode: 404,
        message:
          "Conference not found.",
      });
    }

    await setCache(
      cacheKey,
      conference,
      3600,
    );

    return successResponse(res, {
      message:
        "Conference details fetched successfully.",
      data: conference,
    });
  });

//==================================================
// Update Conference (Admin Only)
//==================================================

export const updateConference = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    conferenceName,
    specialityId,
    startDateTime,
    endDateTime,
    venue,
    conferenceType,
    amount,
    conferenceDetail,
    status,
  } = req.body || {};

  const uploadedFiles = req.uploadedFiles || {};

  const cleanupNewUploads = async () => {
    await deleteUploadedFiles(req.uploadedS3Objects || []);
  };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  const conference = await Conference.findById(id);

  if (!conference) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  // Validate fields only when supplied.

  if (conferenceName !== undefined && !conferenceName.trim()) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Conference name cannot be empty.",
    });
  }

  if (venue !== undefined && !venue.trim()) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Venue cannot be empty.",
    });
  }

  if (
    conferenceDetail !== undefined &&
    (typeof conferenceDetail !== "string" || !conferenceDetail.trim())
  ) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Conference detail cannot be empty.",
    });
  }

  const nextSpecialityId = specialityId ?? conference.specialityId;
  const nextStartDateTime = startDateTime ?? conference.startDateTime;
  const nextEndDateTime = endDateTime ?? conference.endDateTime;
  const nextConferenceType = conferenceType ?? conference.conferenceType;

  if (!isValidConferenceType(nextConferenceType)) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Conference type must be Paid, Free, or Restricted.",
    });
  }

  if (!isValidDateRange(nextStartDateTime, nextEndDateTime)) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message:
        "End date time must be greater than or equal to start date time.",
    });
  }

  if (specialityId && !(await validateSpeciality(specialityId))) {
    await cleanupNewUploads();

    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid or non-existing speciality.",
    });
  }

  let nextAmount;

  if (nextConferenceType === "Paid") {
    nextAmount = amount !== undefined ? amount : conference.amount;

    if (
      nextAmount === undefined ||
      nextAmount === null ||
      nextAmount === "" ||
      !Number.isFinite(Number(nextAmount)) ||
      Number(nextAmount) < 0
    ) {
      await cleanupNewUploads();

      return errorResponse(res, {
        statusCode: 400,
        message: "A valid amount is required for Paid conferences.",
      });
    }
  } else {
    if (amount !== undefined && amount !== "") {
      await cleanupNewUploads();

      return errorResponse(res, {
        statusCode: 400,
        message: "Amount is only allowed for Paid conferences.",
      });
    }

    nextAmount = undefined;
  }

  const oldFiles = [];

  if (uploadedFiles.image) {
    oldFiles.push(conference.image);
    conference.image = uploadedFiles.image;
  }

  if (uploadedFiles.banner) {
    oldFiles.push(conference.banner);
    conference.banner = uploadedFiles.banner;
  }

  if (uploadedFiles.brochureUpload) {
    oldFiles.push(conference.brochureUpload);
    conference.brochureUpload = uploadedFiles.brochureUpload;
  }

  try {
    if (conferenceName !== undefined) {
      conference.conferenceName = conferenceName.trim();
    }

    if (specialityId !== undefined) {
      conference.specialityId = specialityId;
    }

    if (startDateTime !== undefined) {
      conference.startDateTime = startDateTime;
    }

    if (endDateTime !== undefined) {
      conference.endDateTime = endDateTime;
    }

    if (venue !== undefined) {
      conference.venue = venue.trim();
    }

    if (conferenceDetail !== undefined) {
      conference.conferenceDetail = conferenceDetail.trim();
    }

    conference.conferenceType = nextConferenceType;
    conference.amount = nextAmount;

    if (status !== undefined) {
      conference.status = status;
    }

    await conference.save();

    await conference.populate("specialityId", "specialityName");

    // Delete replaced S3 files after the database update succeeds.
    await Promise.allSettled(
      oldFiles.map((fileUrl) => deleteS3Object(fileUrl)),
    );

    await clearConferenceCache();

    return successResponse(res, {
      message: "Conference updated successfully.",
      data: conference,
    });
  } catch (error) {
    // If the DB update fails, remove newly uploaded files.
    await cleanupNewUploads();
    throw error;
  }
});

//==================================================
// Delete Conference (Admin Only)
//==================================================

export const deleteConference = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  const conference = await Conference.findById(id);

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  await conference.deleteOne();

  // Delete associated S3 files.
  await deleteConferenceFiles(conference);

  await clearConferenceCache();

  return successResponse(res, {
    message: "Conference deleted successfully.",
  });
});

//==================================================
// Public: Get Active Conferences (Paginated)
//==================================================

export const getPublicConferences = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);

  const query = buildConferenceQuery(req, {
    status: "Active",
  });

  const sort = buildSortQuery(req, CONFERENCE_SORT_FIELDS, "startDateTime");

  const cacheKey = `conferences:public:${JSON.stringify({
    query,
    sort,
    page,
    limit,
  })}`;

  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return successResponse(res, {
      message: "Active conferences fetched successfully (from cache).",
      data: cachedData.data,
      pagination: cachedData.pagination,
    });
  }

  const [conferences, total] = await Promise.all([
    Conference.find(query)
      .select(CONFERENCE_SELECT_FIELDS)
      .populate("specialityId", "specialityName")
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Conference.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta(total, page, limit);

  const responseData = {
    data: conferences,
    pagination,
  };

  await setCache(cacheKey, responseData, 3600);

  return successResponse(res, {
    message: "Active conferences fetched successfully.",
    data: conferences,
    pagination,
  });
});

//==================================================
// Public: Get Active Conferences Without Pagination
//==================================================

export const getAllPublicConferences = asyncHandler(async (req, res) => {
  const query = buildConferenceQuery(req, {
    status: "Active",
  });

  const sort = buildSortQuery(req, CONFERENCE_SORT_FIELDS, "startDateTime");

  const conferences = await Conference.find(query)
    .select(CONFERENCE_SELECT_FIELDS)
    .populate("specialityId", "specialityName")
    .sort(sort);

  return successResponse(res, {
    message: "Active conferences fetched successfully.",
    data: conferences,
  });
});

//==================================================
// Public: Get Active Conferences By Type (Paginated)
//==================================================

export const getPublicConferencesByType = asyncHandler(async (req, res) => {
  const { conferenceType } = req.params;

  if (!isValidConferenceType(conferenceType)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Conference type must be Paid, Free, or Restricted.",
    });
  }

  const { page, limit, skip } = getPagination(req);

  const query = buildConferenceQuery(req, {
    status: "Active",
    conferenceType,
  });

  const sort = buildSortQuery(req, CONFERENCE_SORT_FIELDS, "startDateTime");

  const [conferences, total] = await Promise.all([
    Conference.find(query)
      .select(CONFERENCE_SELECT_FIELDS)
      .populate("specialityId", "specialityName")
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Conference.countDocuments(query),
  ]);

  return successResponse(res, {
    message: `${conferenceType} conferences fetched successfully.`,
    data: conferences,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

//==================================================
// Public: Get Active Conferences By Type (No Pagination)
//==================================================

export const getAllPublicConferencesByType = asyncHandler(async (req, res) => {
  const { conferenceType } = req.params;

  if (!isValidConferenceType(conferenceType)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Conference type must be Paid, Free, or Restricted.",
    });
  }

  const query = buildConferenceQuery(req, {
    status: "Active",
    conferenceType,
  });

  const sort = buildSortQuery(req, CONFERENCE_SORT_FIELDS, "startDateTime");

  const conferences = await Conference.find(query)
    .select(CONFERENCE_SELECT_FIELDS)
    .populate("specialityId", "specialityName")
    .sort(sort);

  return successResponse(res, {
    message: `${conferenceType} conferences fetched successfully.`,
    data: conferences,
  });
});
