import mongoose from "mongoose";
import XLSX from "xlsx";

import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import Conference from "../models/Conference.js";

import asyncHandler from "../utils/asyncHandler.js";

import { successResponse, errorResponse } from "../utils/response.js";

import generateCouponCode from "../utils/generateCouponCode.js";

//==================================================
// IMPORT COUPONS
// POST /api/conferences/:conferenceId/coupons/import
//==================================================

export const importCoupons = asyncHandler(async (req, res) => {
  const { conferenceId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conferenceId)) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Invalid conference ID.",
    });
  }

  const conference = await Conference.findById(conferenceId).select(
    "_id specialityId conferenceName",
  );

  if (!conference) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Conference not found.",
    });
  }

  if (!req.file) {
    return errorResponse(res, {
      statusCode: 400,
      message: "CSV or Excel file is required.",
    });
  }

  const workbook = XLSX.read(req.file.buffer, {
    type: "buffer",
  });

  const sheet =
    workbook.Sheets[workbook.SheetNames[0]];

  const rows =
    XLSX.utils.sheet_to_json(sheet);

  //==================================================
  // Counters
  //==================================================

  const totalRows = rows.length;

  let importedCount = 0;
  let skippedCount = 0;
  let createdUserCount = 0;
  let existingUserCount = 0;

  const errors = [];

  //==================================================
  // Validators
  //==================================================

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidMobile = (mobile) =>
    /^[6-9]\d{9}$/.test(mobile);

  //==================================================
  // Normalize And Validate Rows
  //==================================================

  const validRows = [];

  const uploadedEmails = new Set();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];

    const fullName = (
      row.name ||
      row.Name ||
      row.NAME
    )
      ?.toString()
      ?.trim();

    const email = (
      row.email ||
      row.Email ||
      row.EMAIL
    )
      ?.toString()
      ?.trim()
      ?.toLowerCase();

    const mobileRaw = (
      row.mobile ||
      row.Mobile ||
      row.MOBILE
    )
      ?.toString()
      ?.trim();

    const mobile =
      mobileRaw && isValidMobile(mobileRaw)
        ? mobileRaw
        : null;

    if (!fullName) {
      skippedCount++;

      errors.push({
        row: index + 2,
        reason: "Name is required.",
      });

      continue;
    }

    if (!email) {
      skippedCount++;

      errors.push({
        row: index + 2,
        reason: "Email is required.",
      });

      continue;
    }

    if (!isValidEmail(email)) {
      skippedCount++;

      errors.push({
        row: index + 2,
        email,
        reason: "Invalid email format.",
      });

      continue;
    }

    if (uploadedEmails.has(email)) {
      skippedCount++;

      errors.push({
        row: index + 2,
        email,
        reason: "Duplicate email in uploaded file.",
      });

      continue;
    }

    uploadedEmails.add(email);

    validRows.push({
      rowNumber: index + 2,
      fullName,
      email,
      mobile,
    });
  }

  //==================================================
  // Existing Users
  //==================================================

  const emails = validRows.map(
    (row) => row.email,
  );

  const existingUsers = await User.find({
    email: {
      $in: emails,
    },
  }).select("_id email");

  const userMap = new Map();

  existingUsers.forEach((user) => {
    userMap.set(user.email, user);
  });

  existingUserCount = existingUsers.length;

  //==================================================
  // Create Missing Users
  //==================================================

  const userBulkOperations = [];

  for (const row of validRows) {
    if (!userMap.has(row.email)) {
      userBulkOperations.push({
        insertOne: {
          document: {
            fullName: row.fullName,
            email: row.email,
            mobile: row.mobile,
            affiliation: "Coupon Import",
            specialityId:
              conference.specialityId,
            role: "user",
            status: "active",
          },
        },
      });
    }
  }

  if (userBulkOperations.length) {
    createdUserCount =
      userBulkOperations.length;

    await User.bulkWrite(
      userBulkOperations,
      {
        ordered: false,
      },
    );
  }

  //==================================================
  // Reload Users
  //==================================================

  const allUsers = await User.find({
    email: {
      $in: emails,
    },
  }).select("_id email");

  const finalUserMap = new Map();

  allUsers.forEach((user) => {
    finalUserMap.set(
      user.email,
      user,
    );
  });

  //==================================================
  // Existing Coupons
  //==================================================

  const existingCoupons =
    await Coupon.find({
      conferenceId,
      email: {
        $in: emails,
      },
    }).select("email");

  const couponEmailSet =
    new Set(
      existingCoupons.map(
        (coupon) =>
          coupon.email,
      ),
    );

  //==================================================
  // Prepare Coupon Insert Operations
  //==================================================

  const couponBulkOperations = [];

  for (const row of validRows) {
    if (
      couponEmailSet.has(
        row.email,
      )
    ) {
      skippedCount++;

      errors.push({
        row: row.rowNumber,
        email: row.email,
        reason:
          "Coupon already exists for this conference.",
      });

      continue;
    }

    const user =
      finalUserMap.get(
        row.email,
      );

    couponBulkOperations.push({
      insertOne: {
        document: {
          conferenceId,

          userId: user._id,

          fullName: row.fullName,

          email: row.email,

          mobile: row.mobile,

          couponCode:
            generateCouponCode(),

          status: "Unused",
        },
      },
    });

    importedCount++;
  }

  //==================================================
  // Bulk Create Coupons
  //==================================================

  if (couponBulkOperations.length) {
    await Coupon.bulkWrite(
      couponBulkOperations,
      {
        ordered: false,
      },
    );
  }

  //==================================================
  // Response
  //==================================================

  return successResponse(res, {
    message:
      "Coupon import completed successfully.",

    data: {
      conferenceId,

      conferenceName:
        conference.conferenceName,

      totalRows,

      importedCount,

      skippedCount,

      createdUserCount,

      existingUserCount,

      errorCount:
        errors.length,

      errors:
        errors.slice(0, 100),
    },
  });
});

//==================================================
// GET ALL COUPONS
// GET /api/conferences/:conferenceId/coupons
//==================================================
export const getCoupons = asyncHandler(async (req, res) => {
  const { conferenceId } = req.params;

  const coupons = await Coupon.find({
    conferenceId,
  })
    .populate("userId", "fullName email mobile")
    .sort({
      createdAt: -1,
    });

  return successResponse(res, {
    message: "Coupons fetched successfully.",

    data: coupons,
  });
});

//==================================================
// GET COUPON BY ID
// GET /api/conferences/:conferenceId/coupons/:couponId
//==================================================
export const getCouponById = asyncHandler(async (req, res) => {
  const { conferenceId, couponId } = req.params;

  const coupon = await Coupon.findOne({
    _id: couponId,
    conferenceId,
  }).populate("userId", "fullName email mobile");

  if (!coupon) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Coupon not found.",
    });
  }

  return successResponse(res, {
    message: "Coupon fetched successfully.",

    data: coupon,
  });
});

//==================================================
// DELETE COUPON
// DELETE /api/conferences/:conferenceId/coupons/:couponId
//==================================================
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { conferenceId, couponId } = req.params;

  const coupon = await Coupon.findOne({
    _id: couponId,
    conferenceId,
  });

  if (!coupon) {
    return errorResponse(res, {
      statusCode: 404,
      message: "Coupon not found.",
    });
  }

  await coupon.deleteOne();

  return successResponse(res, {
    message: "Coupon deleted successfully.",
  });
});
